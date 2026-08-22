$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Speech

$output = 'C:\Users\Robyn\Documents\Codex\ClipChamp\UtopianSociety-voiceover.wav'
$text = @'
The Utopian Society began as a body of constitutional, civic, philosophical, and narrative writing. This project transforms that corpus into a living civic portal: a place where visitors can explore not only what a society believes, but how it might function.

Its frontispiece is an interactive Celtic weave. The outer rings lead into the Society, blogs and essays, the civic portal, and lore. At the center, Utopian Reference Time converts the Gregorian calendar into the Society's own civic measure of time.

Selecting the Society reveals a layered navigation system instead of a conventional menu. Foundational texts, the Circle system, Charters and Codices, and the Constitution remain interlinked, expressing the idea that no civic institution stands alone.

The founding sequence connects the About page, Declaration of Existence, Charter, Constitution, and its Articles. The constitutional body is presented as a readable public instrument rather than a collection of disconnected files.

The civic portal translates those technical documents into ordinary language and usable public interfaces. Its directory distinguishes Foundational Circles, operational bodies, shared instruments, public records, and prototype civic services.

The Circle of Learning demonstrates this approach. Its landing page explains education as a lifelong civic system, including the ten intelligences, relationships with other Circles, and the Utopian Society University. The interactive Tree of Knowledge moves from shared foundations, through the civic core and applied branches, toward continuing development.

The same visual language scales into deeper navigation. Seven equal Foundational Circles: Contribution, Learning, Healing, Harmony, Balance, Custodianship, and Defense, surround the unchanged civic clock.

Working with Codex and G P T five point six, I reconciled contradictions across the corpus, established the seven-Circle topology, built and tested the interactive portal, and connected public records through Cloudflare. Human judgment retained authority over every civic and design decision.

This is not merely a website. It is a prototype for civic life, and the architecture for what may come next.
'@

$speaker = New-Object System.Speech.Synthesis.SpeechSynthesizer
$speaker.SelectVoice('Microsoft David Desktop')
$speaker.Rate = 0
$speaker.Volume = 100
$speaker.SetOutputToWaveFile($output)
$speaker.Speak($text)
$speaker.Dispose()
