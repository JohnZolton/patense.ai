# Patense.ai


Patense.ai is a patent prosecution tool to help lawyers analyze office actions.

Patent 101: if someone already published your thing, you can't patent it. If you find a feature or combination of features that no one else has published, you can patent it (if its not obvious). 

During the application process, patent examiners find relevant references, patent lawyers then either convince the examiner the references don't say the same thing or find amendments to differentiate from the reference.

## Overview
This tool extracts every possible inventive feature from a specification (the initial document you file that reserves your place in time), searches the references for each feature, and uses GPTs to analyze whether the feature is disclosed or not. This essentially creates a map of every possible amendment, saving hours of attorney time.

### V1 - naive
V1 executed a single walk through the specification. 1-2 page chunks were sent one at a time to GPT 3.5 as well as a running list of features. This was slow as hell and didn't scale well at all to 100+ page specifications. Even after upgrading to premium vercel hosting (5 minute serverless functions) and again transferring to AWS serverless (15 minutes max runtime), I needed a new solution. 

### V2 - O(log(n))
V2: Split the entire specification into short 1-2 page chunks, send all chunks in parallel to separate GPT calls asking it to extract every inventive feature. Then recursively combine the lists of features 2 at a time with MORE GPT calls. The runtime is O(log(n)), meaning that if we doubled our input length from 100 to 200 pages, we're only adding one additional cycle of feature consolidation (s/o merge sort for the inspo). I still ran into OpenAI api rate limits but those can just be solved with timeouts since I was well within the runtime limitations on AWS.

### Vector Databases
Once all the possible inventive features are extracted, the cited references are split into small chunks, converted to vectors, and stored. This lets you quickly get relevant sections of text based on a query. The query is converted to a vector (tokenized) and then mapped in the same vector space as the references, from here the closest vectors of text are likely the most relevant. I use a 'parent document retriever' which is a little more sophisticated. It splits the text into chunks, then further splits those chunks into even smaller chunks. The smaller chunks are queried for the search but since the smaller chunks are linked to the larger chunks, it returns the larger chunks so more context is given to the model.

So we get the most relevant chunks of references, pass them in to GPT with each feature, and ask it if the feature is disclosed by the text. Those responses are stored in a report so the user can easily tell which features make for good amendments and which don't.

Using a vector DB like this was fast but ultimately wasn't good enough to get the relevant text for each feature. Its not guaranteed that the AI will get the same text the examiner relied on. So I spent 2 weeks writing regex's and trying to get GPTs to parse citations and extract cited text. So GPTs could read the citation, go get the relevant text and analyze it. But if you get 10 different office actions you'll find 10 different ways of citing content. And the same for references. And on top of that examiners can just be wrong and cite incorrectly. I then tried parsing with GPTs and 3.5 was too unreliable.

### App Structure
The user uploads a PDF of the specification and all the cited references. The app stores the docs using uploadthing, a developer-friendly wrapper on AWS S3. From there I used langchain to verify the PDFs have text and before going forward with the analysis. Then the user is directed to a stripe payment session. An AWS API gateway listens for the stripe payment webhook. Then the API gateway triggers an AWS lambda function that does the feature extraction and analysis. I put the long-running GPT analysis tasks on an AWS lambda function with a 15 minute max runtime to handle the ~300 GPT calls and inevitable rate-limiting. 

### A New Challenger
During my regex excursion, Anthropic released Claude 3 - Opus. Whatever black magic they did, they completely obviated the issues I was trying to solve. You can straight up pass references and office actions into the model and have a coherent conversation over them. It made the problems I solved moot. So for now, this project is over.
