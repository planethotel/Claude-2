#!/usr/bin/env python3
"""
Fine-tuning QLoRA local, sans dépendance à un service cloud.

Entraîne un adaptateur LoRA au-dessus d'un modèle open-weight (Hugging Face)
sur ton propre dataset. Le résultat est un petit dossier d'adaptateur
("output/lora-adapter") à fusionner ensuite avec merge_and_export.py.

Format de dataset attendu (JSONL), un exemple par ligne:
    {"instruction": "...", "output": "..."}
Voir dataset_example.jsonl.

Usage:
    pip install -r requirements.txt
    python train_lora.py \
        --base-model meta-llama/Meta-Llama-3.1-8B-Instruct \
        --dataset dataset_example.jsonl \
        --output-dir output/lora-adapter \
        --epochs 3

Note: certains modèles (ex. Llama) demandent d'accepter une licence sur
Hugging Face et de se connecter via `huggingface-cli login`. Pour un modèle
totalement libre de contraintes de licence, utilise par ex.
"Qwen/Qwen2.5-7B-Instruct" ou "mistralai/Mistral-7B-Instruct-v0.3".
"""
import argparse

from datasets import load_dataset
from peft import LoraConfig, get_peft_model, prepare_model_for_kbit_training
from transformers import (
    AutoModelForCausalLM,
    AutoTokenizer,
    BitsAndBytesConfig,
    TrainingArguments,
)
from trl import SFTTrainer
import torch


PROMPT_TEMPLATE = """### Instruction:
{instruction}

### Réponse:
{output}"""


def build_dataset(path: str, tokenizer):
    ds = load_dataset("json", data_files=path, split="train")

    def format_example(example):
        text = PROMPT_TEMPLATE.format(
            instruction=example["instruction"], output=example["output"]
        )
        return {"text": text}

    return ds.map(format_example)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--base-model", required=True, help="ID Hugging Face du modèle de base")
    parser.add_argument("--dataset", required=True, help="Fichier JSONL d'entraînement")
    parser.add_argument("--output-dir", default="output/lora-adapter")
    parser.add_argument("--epochs", type=int, default=3)
    parser.add_argument("--lr", type=float, default=2e-4)
    parser.add_argument("--batch-size", type=int, default=2)
    parser.add_argument("--lora-r", type=int, default=16)
    parser.add_argument("--lora-alpha", type=int, default=32)
    parser.add_argument("--max-seq-length", type=int, default=1024)
    args = parser.parse_args()

    print(f"== Chargement du modèle de base en 4-bit: {args.base_model} ==")
    bnb_config = BitsAndBytesConfig(
        load_in_4bit=True,
        bnb_4bit_use_double_quant=True,
        bnb_4bit_quant_type="nf4",
        bnb_4bit_compute_dtype=torch.bfloat16,
    )

    tokenizer = AutoTokenizer.from_pretrained(args.base_model)
    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token

    model = AutoModelForCausalLM.from_pretrained(
        args.base_model,
        quantization_config=bnb_config,
        device_map="auto",
    )
    model = prepare_model_for_kbit_training(model)

    lora_config = LoraConfig(
        r=args.lora_r,
        lora_alpha=args.lora_alpha,
        lora_dropout=0.05,
        bias="none",
        task_type="CAUSAL_LM",
        target_modules=["q_proj", "k_proj", "v_proj", "o_proj"],
    )
    model = get_peft_model(model, lora_config)
    model.print_trainable_parameters()

    print(f"== Préparation du dataset: {args.dataset} ==")
    train_dataset = build_dataset(args.dataset, tokenizer)

    training_args = TrainingArguments(
        output_dir=args.output_dir,
        num_train_epochs=args.epochs,
        per_device_train_batch_size=args.batch_size,
        gradient_accumulation_steps=4,
        learning_rate=args.lr,
        bf16=True,
        logging_steps=5,
        save_strategy="epoch",
        report_to=[],
    )

    trainer = SFTTrainer(
        model=model,
        args=training_args,
        train_dataset=train_dataset,
        dataset_text_field="text",
        max_seq_length=args.max_seq_length,
    )

    print("== Entraînement ==")
    trainer.train()

    print(f"== Sauvegarde de l'adaptateur LoRA dans {args.output_dir} ==")
    trainer.model.save_pretrained(args.output_dir)
    tokenizer.save_pretrained(args.output_dir)

    print("Terminé. Étape suivante: python merge_and_export.py")


if __name__ == "__main__":
    main()
