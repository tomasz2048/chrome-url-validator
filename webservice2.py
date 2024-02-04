# Import FastAPI and Uvicorn
from fastapi import FastAPI
from typing import List
import uvicorn

# Create a FastAPI application instance
app = FastAPI()

# Define your endpoint
@app.get("/vz_urls", response_model=List[str])
async def read_vz_urls():
    # Return a list of URLs
    return ["google.com",
            "github.com",
            #"verizon.com",
            "onet.pl"]

# Run the application using Uvicorn programmatically
if __name__ == "__main__":
    # Directly pass the app instance to uvicorn.run()
    uvicorn.run(app='webservice2:app', host="127.0.0.1", port=8002, reload=True)
