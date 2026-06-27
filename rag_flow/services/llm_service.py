import os
from langchain_groq import ChatGroq

def generate_answer(query: str, retrieved_docs: list, llm_model: str = "llama-3.3-70b-versatile") -> dict:
    groq_api_key = os.getenv("GROQAPIKEY")
    
    sources = []
    context = ""
    for d in retrieved_docs:
        source_file = d['metadata'].get('source_filename', 'Unknown')
        chunk_content = d['document']
        sources.append({
            "file": source_file,
            "score": d['similarity_score'],
            "chunk": chunk_content[:200] + "..." # truncate for UI
        })
        context += f"Document: {source_file}\nContent: {chunk_content}\n\n"
    
    if not groq_api_key:
        return {"answer": "Error: GROQAPIKEY not found in .env", "sources": sources}
            
    llm = ChatGroq(api_key=groq_api_key, model=llm_model, temperature=0)
    
    system_instruction = (
        "You are a helpful, precise RAG assistant. You must answer the user's question STRICTLY using the provided document context. "
        "If there is no context provided, or if the context does not contain the answer to the question, you must respond with: "
        "'I cannot find the answer in the uploaded documents.' Do NOT answer from your general knowledge or make up facts."
    )
    
    if not retrieved_docs:
        prompt = f"{system_instruction}\n\nQuestion: {query}\nAnswer:"
    else:
        prompt = f"{system_instruction}\n\nUse the following context to answer the question:\n\n{context}\n\nQuestion: {query}\nAnswer:"
    
    response = llm.invoke([prompt])
    
    return {
        "answer": response.content,
        "sources": sources
    }
