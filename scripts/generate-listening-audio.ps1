param(
  [string]$OutputPath = (Join-Path $PSScriptRoot '..\audio\listening\diagnostic-part-1.wav'),
  [string]$Voice = 'Microsoft Zira Desktop'
)

$text = @'
Emma: Hi Lucas, are you still free to go to the climbing centre on Saturday?
Lucas: I thought we were meeting at ten. Has something changed?
Emma: My cousin is visiting from Bristol, and my parents have planned a family lunch. Could we go in the afternoon instead?
Lucas: That works for me. I have a basketball match in the morning anyway.
Emma: Perfect. I will book the two o'clock session.
'@

$directory = Split-Path -Parent $OutputPath
New-Item -ItemType Directory -Force -Path $directory | Out-Null
Add-Type -AssemblyName System.Speech
$speaker = New-Object System.Speech.Synthesis.SpeechSynthesizer
try {
  $speaker.SelectVoice($Voice)
} catch {
  Write-Warning "The requested voice '$Voice' is unavailable. The Windows default voice will be used."
}
$speaker.Rate = 0
try {
  $speaker.SetOutputToWaveFile($OutputPath)
  $speaker.Speak($text)
  Write-Host "Created $OutputPath"
} finally {
  $speaker.Dispose()
}
