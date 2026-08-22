$ErrorActionPreference = 'Stop'

$ffmpeg = 'C:\Program Files\DashWare\ffmpeg.exe'
$video = 'C:\Users\Robyn\Documents\Codex\ClipChamp\UtopianSociety.mp4'
$review = 'C:\Users\Robyn\Documents\Codex\ClipChamp\review'

New-Item -ItemType Directory -Force -Path $review | Out-Null
& $ffmpeg -y -i $video -vf "fps=1/15,scale=480:-1" "$review\frame-%03d.jpg"
