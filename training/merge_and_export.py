#!/usr/bin/env python3
"""
Fusionne un adaptateur LoRA (produit par train_lora.py) dans le modèle de
base, puis prépare un modèle "full weights" prêt à convertir en GGUF pour
Ollama.

Usage:
    python merge_and_export.py \
        --base-model meta-llama/Meta-Llama-3.1-8B-Instruct \
        --adapter output/lora-adapter \
        --output-dir output/merged-model

Étape suivante (hors de ce script, nécessite llama.cpp):
    git clone https://github.com/ggerganov/llama.cpp
    cd llama.cpp && pip install -r requirements.txt
    python convert_hf_to_gguf.py ../output/merged-model \
        --outfile ../output/mon-modele.gguf --outtype q4_k_m

Puis dans Ollama:
    ollama create mon-assistant -f ollama/Modelfile
    (avec `FROM ./training/output/mon-modele.gguf` dans le Modelfile)
"""
import argparse

from peft import PeftModel
from transformers import AutoModelForCausalLM, AutoTokenizer
import torch


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--base-model", required=True)
    parser.add_argument("--adapter", required=True, help="Dossier de l'adaptateur LoRA")
    parser.add_argument("--output-dir", default="output/merged-model")
    args = parser.parse_args()

    print(f"== Chargement du modèle de base (poids complets): {args.base_model} ==")
    base_model = AutoModelForCausalLM.from_pretrained(
        args.base_model,
        torch_dtype=torch.bfloat16,
        device_map="auto",
    )
    tokenizer = AutoTokenizer.from_pretrained(args.base_model)

    print(f"== Fusion de l'adaptateur LoRA: {args.adapter} ==")
    merged = PeftModel.from_pretrained(base_model, args.adapter)
    merged = merged.merge_and_unload()

    print(f"== Sauvegarde du modèle fusionné dans {args.output_dir} ==")
    merged.save_pretrained(args.output_dir, safe_serialization=True)
    tokenizer.save_pretrained(args.output_dir)

    print("Terminé. Convertis maintenant ce dossier en GGUF avec llama.cpp")
    print("(voir le docstring de ce script pour la commande exacte),")
    print("puis pointe le Modelfile Ollama vers le fichier .gguf obtenu.")


if __name__ == "__main__":
    main()
