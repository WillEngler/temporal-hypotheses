This file contains the original notebook used to generate the LK99 veracity data, plus a new notebook that Will tweaked to get the process running against the Gemini API instead of a local ollama server.

To re-run and tweak, you can run Generate_L99_Evaluation.ipynb in Colab, with LK99_Data.xlsx at the root of the ephemeral filesystem.

Paste the final JSON files as list listerals in temporal-hypotheses/src/components/LK99Chart.tsx. Then if you push the changes to main, the website should redeploy on GH pages with the new data.