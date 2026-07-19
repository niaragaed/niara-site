"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { Camera, Trash2, User } from "lucide-react";

const MAX_SIZE_BYTES = 2 * 1024 * 1024;

export function AvatarUpload() {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // a foto nunca sai do navegador — só criamos um object URL local, que
  // precisa ser revogado ao trocar de imagem ou desmontar o componente
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Selecione um arquivo de imagem.");
      return;
    }
    if (file.size > MAX_SIZE_BYTES) {
      setError("A imagem deve ter no máximo 2MB.");
      return;
    }

    setError(null);
    setPreviewUrl((current) => {
      if (current) URL.revokeObjectURL(current);
      return URL.createObjectURL(file);
    });
  }

  function handleRemove() {
    setPreviewUrl((current) => {
      if (current) URL.revokeObjectURL(current);
      return null;
    });
    setError(null);
  }

  return (
    <div className="flex items-center gap-4">
      <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-bg-elevated">
        {previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- object URL local; não passa pelo otimizador do next/image
          <img
            src={previewUrl}
            alt="Foto de perfil"
            className="h-full w-full object-cover"
          />
        ) : (
          <User className="h-8 w-8 text-text-muted" aria-hidden="true" />
        )}
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-text-primary hover:border-accent-blue"
          >
            <Camera className="h-3.5 w-3.5" aria-hidden="true" />
            Alterar
          </button>
          {previewUrl && (
            <button
              type="button"
              onClick={handleRemove}
              className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-text-secondary hover:border-negative hover:text-negative"
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
              Remover
            </button>
          )}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
          aria-label="Selecionar foto de perfil"
        />
        <p className="text-[11px] text-text-muted">
          JPG ou PNG, até 2MB. A imagem não é enviada — fica só no seu
          navegador.
        </p>
        {error && (
          <p role="alert" className="text-xs text-negative">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
