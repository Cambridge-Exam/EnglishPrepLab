Add-Type -AssemblyName System.Speech

$projectRoot = Split-Path $PSScriptRoot -Parent
$out = Join-Path $projectRoot '\version-2\audio'

New-Item -ItemType Directory -Force -Path $out | Out-Null

$tracks = @{
    'listening-1.wav' = @"
When our teacher first announced the group project, I wasn't very enthusiastic. I had enjoyed the subject itself, but I thought the project would take up too much of my free time. I was also worried because I didn't know two of the students in my group very well.
Things changed when we chose our topic. We decided to investigate how teenagers use music while studying, and suddenly I became much more interested. We found plenty of information, so research wasn't really a problem.
The difficult part came later. We had collected lots of ideas, but we couldn't agree on how to organise our presentation. Everyone thought their own idea was important. Eventually, we made a plan and divided the presentation into clear sections.
The experience taught me that spending a little more time planning at the beginning can actually save a lot of time later. I wouldn't say I'm looking forward to every future group project, but I certainly wouldn't be against doing another one.
"@

    'listening-2.wav' = @"
The first musical instrument I learned was the guitar. I'd always liked the sound of it, and several of my friends played, so I thought it would be fun to learn together.
At the beginning, I practised for about twenty minutes every evening. I improved quite quickly during the first few months, but then my progress seemed to stop. I could play the basic chords, but I couldn't move on to more difficult songs.
The problem was that I kept practising the things I already knew instead of working on my weaknesses. Eventually, my teacher suggested that I spend part of each practice session on a specific difficult technique. I followed this advice, and after a few weeks I noticed a real improvement.
"@
}

foreach ($track in $tracks.GetEnumerator()) {

    $outputFile = Join-Path $out $track.Key

    $synth = New-Object System.Speech.Synthesis.SpeechSynthesizer

    try {
        $synth.SelectVoice("Microsoft Zira Desktop")

        # Légèrement plus lent pour un test Cambridge
        $synth.Rate = -1
        $synth.Volume = 100

        Write-Host "Voice: Microsoft Zira Desktop"
        Write-Host "Creating: $outputFile"

        $synth.SetOutputToWaveFile($outputFile)
        $synth.Speak($track.Value)

        Write-Host "Created successfully."
    }
    finally {
        $synth.Dispose()
    }
}

Write-Host ""
Write-Host "Audio generation completed."