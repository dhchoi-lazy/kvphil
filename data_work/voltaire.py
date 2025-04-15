import os
from bs4 import BeautifulSoup
import pandas as pd

# Get a sorted list of all XML files in the directory
data_files = sorted(
    [f for f in os.listdir("./vectordb/voltaire") if f.endswith(".xml")]
)

# Initialize a list to store the extracted data
articles = []

# Loop over each XML file
for file_path in data_files[1:2]:
    print(f"Processing {file_path}")
    with open(f"./vectordb/voltaire/{file_path}", "r", encoding="utf-8") as f:
        xml_content = f.read()
    # Parse the XML content using BeautifulSoup with the 'xml' parser
    soup = BeautifulSoup(xml_content, "xml")

    # Find all <div1> elements
    divs = soup.find_all("div1")
    for div in divs:
        # Create a dictionary to store the title and paragraphs for each article
        article = {}

        # Find the <head> element within the <div1>
        head = div.find("head")
        if head and head.text:
            title = head.text.strip()
            article["title"] = title
            print(f"Title: {title}")
        ps = div.find_all("p")
        print(len(ps))
        # Find all <p> elements within the <div1>
        # ps = div.find_all("p")
        # paragraphs = []
        # for p in ps:
        #     # Remove <ln> tags but keep their text
        #     for ln in p.find_all("ln"):
        #         ln.unwrap()
        #     # Get the text content of the paragraph
        #     paragraph_text = p.get_text(separator=" ", strip=True)
        #     paragraphs.append(paragraph_text)
        #     print(f"Paragraph: {paragraph_text}")

        # # Add the collected paragraphs to the article dictionary
        # article["paragraphs"] = paragraphs
        # # Append the article to the list of articles
        # articles.append(article)

    # If you only want to process the last file, uncomment the next line
    break

# Optionally, create a DataFrame from the articles
# This will create one row per article with the title and paragraphs
df = pd.DataFrame(articles)

# If you want each paragraph to be a separate row with its associated title
rows = []
for article in articles:
    title = article["title"]
    for para in article["paragraphs"]:
        rows.append({"Title": title, "Paragraph": para})

df_paragraphs = pd.DataFrame(rows)

# Display the DataFrame with one paragraph per row
print(df_paragraphs)
