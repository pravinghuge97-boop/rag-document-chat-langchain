from pathlib import Path
from langchain_community.document_loaders import PyMuPDFLoader, TextLoader, WebBaseLoader, Docx2txtLoader

import pandas as pd
from langchain_core.documents import Document
import textract
def process_pdf(file_path: str):
    loader = PyMuPDFLoader(str(file_path))
    docs = loader.load()
    for doc in docs:
        doc.metadata["source_filename"] = Path(file_path).name
    return docs

def process_txt(file_path: str):
    loader = TextLoader(str(file_path))
    docs = loader.load()
    for doc in docs:
        doc.metadata["source_filename"] = Path(file_path).name
    return docs

def process_url(url: str):
    loader = WebBaseLoader(url)
    docs = loader.load()
    for doc in docs:
        doc.metadata["source_filename"] = url
    return docs


def process_excel(file_path: str):
    df = pd.read_excel(file_path)

    docs = []

    for index, row in df.iterrows():

        content = ""

        for column in df.columns:
            content += f"{column}: {row[column]}\n"

        docs.append(
            Document(
                page_content=content,
                metadata={
                    "source_filename": Path(file_path).name,
                    "row": index + 1,
                }
            )
        )

    return docs

def process_csv(file_path: str):
    df = pd.read_csv(file_path)
    docs = []

    df = df.fillna("")

    for index, row in df.iterrows():

        text = ""

        for column in df.columns:
            text += f"{column}: {row[column]}\n"

        docs.append(
            Document(
                page_content=text,
                metadata={
                    "source_filename": Path(file_path).name,
                    "row": index + 1,
                    "file_type": "csv",
                }
            )
        )

    return docs

def process_docx(file_path: str):
    loader = Docx2txtLoader(str(file_path))
    docs = loader.load()

    for doc in docs:
        doc.metadata["source_filename"] = Path(file_path).name

    return docs

def process_doc(file_path: str):
    text = textract.process(file_path).decode("utf-8")

    return [
        Document(
            page_content=text,
            metadata={
                "source_filename": Path(file_path).name,
            },
        )
    ]