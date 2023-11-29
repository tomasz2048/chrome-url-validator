from fastapi import FastAPI
from urllib.parse import urlparse
from pydantic import BaseModel, HttpUrl
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

class UrlItem(BaseModel):
    url: HttpUrl

@app.post("/check_url/")
async def check_url(item: UrlItem):
    url_str = str(item.url)
    print(url_str)
    parsed_url = urlparse(url_str)

    # Remove 'www.' if present in the domain
    domain = parsed_url.netloc
    if domain.startswith('www.'):
        domain = domain[4:]

    if domain.endswith('verizon.com'):
        return {"status": "verizon"}
    elif (domain == 'google.com' or domain == 'bing.com'):
        return {"status": "suspicious"}
    else:
        return {"status": "non-verizon"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
