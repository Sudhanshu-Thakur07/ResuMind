from backend.config import groq_client, llm_model


def content_extraction(content, response_format, content_type):

    user_prompt = f"""
                    You are a {content_type} information extractor.

                    Read the provided content carefully and extract only information
                    that is explicitly present.

                    Do not invent information.
                    Do not add information from your own knowledge.

                    If some field is not available, return an empty string or empty list.

                    CONTENT:
                    {content}

                    Return the result strictly according to the provided schema.  """


    response = groq_client.chat.completions.create(
        messages=[
            {
                "role": "user",
                "content": user_prompt
            }
        ],
        model=llm_model,
        response_format=response_format,
        max_tokens=900
    )

    return response.choices[0].message.content




def generate_llm_response(prompt, response_format):

    response = groq_client.chat.completions.create(
        model="qwen/qwen3.8-27b",
        messages=[
            {
                "role": "system",
                "content": "Return only valid JSON."
            },
            {
                "role": "user",
                "content": prompt
            }
        ],
        response_format=response_format,
        temperature=0,
        max_tokens=900
    )

    return response.choices[0].message.content