#!/usr/bin/env bash
# Gera todas as variações de um vídeo a partir do arquivo original.
# Uso: ./scripts/gerar-variacoes.sh caminho/do/original.mp4 video-01
# Saída: saida/video-01/{9x16,9x16-leve,1x1,16x9}.mp4, thumb.jpg, audio.m4a
# Requer ffmpeg instalado (brew install ffmpeg / apt install ffmpeg).
set -euo pipefail

ORIGINAL="${1:?Informe o arquivo original}"
SLUG="${2:?Informe o slug do vídeo (ex.: video-01)}"
OUT="saida/${SLUG}"
mkdir -p "$OUT"

# Fundo desfocado para preencher as laterais quando o formato muda.
fundo() { # $1=largura $2=altura
  echo "[0:v]split=2[a][b];[a]scale=$1:$2:force_original_aspect_ratio=increase,crop=$1:$2,boxblur=30:5,eq=brightness=-0.08[bg];[b]scale=$1:$2:force_original_aspect_ratio=decrease[fg];[bg][fg]overlay=(W-w)/2:(H-h)/2,setsar=1[v]"
}

PRESET="${PRESET:-slow}"  # use PRESET=veryfast para testes rápidos
H264="-c:v libx264 -preset $PRESET -pix_fmt yuv420p -movflags +faststart"
AAC="-c:a aac -b:a 128k"

echo "→ 9x16 (alta qualidade, Status/Reels/TikTok)"
ffmpeg -y -i "$ORIGINAL" -filter_complex "$(fundo 1080 1920)" -map "[v]" -map 0:a? $H264 -crf 20 $AAC "$OUT/9x16.mp4"

echo "→ 9x16-leve (WhatsApp; mira abaixo de ~16 MB)"
ffmpeg -y -i "$ORIGINAL" -filter_complex "$(fundo 720 1280)" -map "[v]" -map 0:a? $H264 -crf 28 -maxrate 1500k -bufsize 3000k -c:a aac -b:a 96k "$OUT/9x16-leve.mp4"

echo "→ 1x1 (feed)"
ffmpeg -y -i "$ORIGINAL" -filter_complex "$(fundo 1080 1080)" -map "[v]" -map 0:a? $H264 -crf 21 $AAC "$OUT/1x1.mp4"

echo "→ 16x9 (YouTube, X)"
ffmpeg -y -i "$ORIGINAL" -filter_complex "$(fundo 1920 1080)" -map "[v]" -map 0:a? $H264 -crf 21 $AAC "$OUT/16x9.mp4"

echo "→ thumb.jpg (quadro aos 2s)"
ffmpeg -y -ss 2 -i "$OUT/9x16.mp4" -frames:v 1 -q:v 3 "$OUT/thumb.jpg"

echo "→ audio.m4a"
ffmpeg -y -i "$ORIGINAL" -vn -c:a aac -b:a 128k "$OUT/audio.m4a" || true

echo
ls -lh "$OUT"
LEVE=$(stat -c%s "$OUT/9x16-leve.mp4" 2>/dev/null || stat -f%z "$OUT/9x16-leve.mp4")
if [ "$LEVE" -gt 16000000 ]; then
  echo "Atenção: a versão leve passou de 16 MB. Aumente o -crf da versão leve ou corte o vídeo."
fi
echo "Pronto. Suba a pasta $OUT para o bucket (veja o README)."
