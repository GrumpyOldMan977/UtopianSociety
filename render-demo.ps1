$ErrorActionPreference = 'Stop'

$root = 'C:\Users\Robyn\Documents\Codex\ClipChamp'
$ffmpeg = Get-ChildItem "$env:LOCALAPPDATA\Microsoft\WinGet\Packages" -Filter ffmpeg.exe -Recurse -File |
    Where-Object { $_.FullName -like '*Gyan.FFmpeg.Shared*' } |
    Select-Object -First 1 -ExpandProperty FullName

if (-not $ffmpeg) { throw 'Modern FFmpeg installation not found.' }

Push-Location $root
try {
    # The source is accelerated slightly so its natural three-minute tour follows
    # the 2:32 narration without rushed speech or dead air.
    $filter = "[0:v]setpts=0.86*PTS[base];" +
              "[base][2:v]overlay=W-w-42:32:enable='between(t,0,8)'[intro];" +
              "[intro][3:v]overlay=(W-w)/2:34:enable='between(t,132,151)'[cards];" +
              "[cards]subtitles=UtopianSociety-Ava-captions.srt:" +
              "force_style='FontName=Arial,FontSize=10,PrimaryColour=&H00F8F1DF," +
              "OutlineColour=&HCC06231C,BorderStyle=3,BackColour=&H9906231C," +
              "Outline=1,Shadow=0,MarginV=30'[video]"

    & $ffmpeg -y `
        -i 'UtopianSociety.mp4' `
        -i 'UtopianSociety-Ava-narration.mp3' `
        -loop 1 -i 'overlay-opening.png' `
        -loop 1 -i 'overlay-codex.png' `
        -filter_complex $filter `
        -map '[video]' -map '1:a:0' `
        -c:v libx264 -preset veryfast -crf 20 -pix_fmt yuv420p `
        -c:a aac -b:a 192k `
        -t 154 -movflags +faststart `
        'UtopianSociety-BuildWeek-Demo.mp4'
}
finally {
    Pop-Location
}
