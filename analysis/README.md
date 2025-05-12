This file contains the original notebook used to generate the LK99 veracity data, plus a new notebook that Will tweaked to get the process running against the Gemini API instead of a local ollama server.

To re-run and tweak, you can run Generate_L99_Evaluation.ipynb in Colab, with LK99_Data.xlsx at the root of the ephemeral filesystem.

Save the final JSON files generated in temporal-hypotheses/public as lk99.json and betting.json. Then if you push the changes to main, the website should redeploy on GH pages with the new data.