#!/usr/bin/env python3
"""
Entraine ton modele local (LoRA) sur tes propres exemples, puis l'exporte
directement dans Ollama.

    python train_lora.py --dataset mes-donnees.jsonl --nom mon-ia-v2

Format du dataset (JSONL, un objet par ligne) :
    {"messages":[{"role":"user","content":"..."},{"role":"assistant","content":"..."}]}

Materiel : GPU NVIDIA (>= 8 Go VRAM) recommande.
  - Mac Apple Silicon  -> utilise MLX a la place, voir README.md
  - CPU seul           -> techniquement possible mais compte des heures/jours
"""
import argparse
import json
import subprocess
import sys
from pathlib import Path


def charger_dataset(chemin: Path):
    """Lit le JSONL et valide chaque ligne avant de lancer un entrainement long."""
    if not chemin.exists():
        sys.exit(f"Dataset introuvable : {chemin}")

    exemples = []
    for num, ligne in enumerate(chemin.read_text(encoding="utf-8").splitlines(), 1):
        ligne = ligne.strip()
        if not ligne:
            continue
        try:
            obj = json.loads(ligne)
        except json.JSONDecodeError as e:
            sys.exit(f"Ligne {num} : JSON invalide -> {e}")

        msgs = obj.get("messages")
        if not isinstance(msgs, list) or len(msgs) < 2:
            sys.exit(f"Ligne {num} : il faut une cle 'messages' avec >= 2 entrees.")
        for m in msgs:
            if m.get("role") not in {"system", "user", "assistant"} or "content" not in m:
                sys.exit(f"Ligne {num} : chaque message veut 'role' + 'content'.")
        exemples.append({"messages": msgs})

    if not exemples:
        sys.exit(f"{chemin} est vide.")
    if len(exemples) < 10:
        print(f"[!] Seulement {len(exemples)} exemples. En dessous de ~50 le modele "
              f"n'apprendra pas grand-chose de stable.")
    return exemples


def main():
    p = argparse.ArgumentParser(description=__doc__,
                                formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("--dataset", default="dataset.exemple.jsonl", type=Path,
                   help="fichier JSONL d'entrainement")
    p.add_argument("--base", default="unsloth/llama-3.1-8b-instruct-bnb-4bit",
                   help="modele de depart sur HuggingFace")
    p.add_argument("--nom", default="mon-ia-v2", help="nom du modele Ollama produit")
    p.add_argument("--epochs", type=float, default=3.0, help="passages sur le dataset")
    p.add_argument("--lr", type=float, default=2e-4, help="taux d'apprentissage")
    p.add_argument("--rang", type=int, default=16,
                   help="rang LoRA : 8=leger, 16=equilibre, 64=fort (plus = plus de VRAM)")
    p.add_argument("--ctx", type=int, default=2048, help="longueur de sequence max")
    p.add_argument("--quant", default="q4_k_m", help="quantification GGUF de sortie")
    args = p.parse_args()

    exemples = charger_dataset(args.dataset)
    print(f"[1/5] Dataset valide : {len(exemples)} exemples depuis {args.dataset}")

    try:
        from unsloth import FastLanguageModel
        from datasets import Dataset
        from trl import SFTTrainer
        from transformers import TrainingArguments
        import torch
    except ImportError as e:
        sys.exit(f"Dependance manquante ({e.name}). Lance d'abord :\n"
                 f"    pip install -r requirements.txt")

    if not torch.cuda.is_available():
        print("[!] Aucun GPU CUDA detecte. L'entrainement sera extremement lent.\n"
              "    Sur Mac Apple Silicon, utilise MLX (voir README.md).")

    print(f"[2/5] Chargement du modele de base : {args.base}")
    model, tokenizer = FastLanguageModel.from_pretrained(
        model_name=args.base,
        max_seq_length=args.ctx,
        load_in_4bit=True,
    )

    model = FastLanguageModel.get_peft_model(
        model,
        r=args.rang,
        lora_alpha=args.rang,
        lora_dropout=0.0,
        bias="none",
        target_modules=["q_proj", "k_proj", "v_proj", "o_proj",
                        "gate_proj", "up_proj", "down_proj"],
        use_gradient_checkpointing="unsloth",
        random_state=3407,
    )

    # Chaque conversation est mise au format attendu par le modele de base.
    def formater(lot):
        return {"text": [tokenizer.apply_chat_template(m, tokenize=False)
                         for m in lot["messages"]]}

    dataset = Dataset.from_list(exemples).map(formater, batched=True)

    print(f"[3/5] Entrainement : {args.epochs} epochs, lr={args.lr}, rang LoRA={args.rang}")
    trainer = SFTTrainer(
        model=model,
        tokenizer=tokenizer,
        train_dataset=dataset,
        dataset_text_field="text",
        max_seq_length=args.ctx,
        args=TrainingArguments(
            per_device_train_batch_size=2,
            gradient_accumulation_steps=4,
            warmup_steps=5,
            num_train_epochs=args.epochs,
            learning_rate=args.lr,
            fp16=not torch.cuda.is_bf16_supported(),
            bf16=torch.cuda.is_bf16_supported(),
            logging_steps=1,
            optim="adamw_8bit",
            weight_decay=0.01,
            lr_scheduler_type="linear",
            seed=3407,
            output_dir="sorties",
            report_to="none",
        ),
    )
    trainer.train()

    dossier_gguf = f"{args.nom}-gguf"
    print(f"[4/5] Export GGUF ({args.quant}) vers {dossier_gguf}/")
    model.save_pretrained_gguf(dossier_gguf, tokenizer, quantization_method=args.quant)

    gguf = next(Path(dossier_gguf).glob("*.gguf"), None)
    if gguf is None:
        sys.exit(f"Export GGUF termine mais aucun .gguf trouve dans {dossier_gguf}/")

    print(f"[5/5] Import dans Ollama sous le nom '{args.nom}'")
    modelfile = Path(f"{args.nom}.Modelfile")
    modelfile.write_text(
        f"FROM ./{gguf.relative_to(Path.cwd()) if gguf.is_absolute() else gguf}\n"
        f'SYSTEM """Tu es mon assistant personnel, entraine sur mes propres donnees."""\n'
        f"PARAMETER temperature 0.8\n"
        f"PARAMETER num_ctx {args.ctx}\n",
        encoding="utf-8",
    )

    try:
        subprocess.run(["ollama", "create", args.nom, "-f", str(modelfile)], check=True)
    except FileNotFoundError:
        sys.exit(f"Ollama introuvable. Modele pret dans {gguf}, importe-le avec :\n"
                 f"    ollama create {args.nom} -f {modelfile}")
    except subprocess.CalledProcessError as e:
        sys.exit(f"'ollama create' a echoue (code {e.returncode}).")

    print(f"\nTermine. Lance-le :  ollama run {args.nom}")


if __name__ == "__main__":
    main()
