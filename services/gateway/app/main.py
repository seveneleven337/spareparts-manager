
import os

import httpx
from fastapi import FastAPI, HTTPException, Request, Response, status


PARTS_SERVICE_URL = os.getenv(
    "PARTS_SERVICE_URL",
    "http://parts-service:8001",
).rstrip("/")

app = FastAPI(
    title="SpareParts API Gateway",
    description="Single entry point for the SpareParts microservices.",
    version="0.1.0",
)

HOP_BY_HOP_HEADERS = {
    "connection",
    "keep-alive",
    "proxy-authenticate",
    "proxy-authorization",
    "te",
    "trailers",
    "transfer-encoding",
    "upgrade",
    "content-length",
    "content-encoding",
}


async def forward_request(
    method: str,
    path: str,
    request: Request,
) -> Response:
    """Forward a request to the Parts Service."""

    url = f"{PARTS_SERVICE_URL}{path}"

    if request.url.query:
        url = f"{url}?{request.url.query}"

    request_headers = {
        key: value
        for key, value in request.headers.items()
        if key.lower() not in HOP_BY_HOP_HEADERS
        and key.lower() != "host"
    }

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            upstream_response = await client.request(
                method=method,
                url=url,
                content=await request.body(),
                headers=request_headers,
            )

    except httpx.TimeoutException:
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail="Parts Service timed out.",
        ) from None

    except httpx.RequestError:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Parts Service is unavailable.",
        ) from None

    response_headers = {
        key: value
        for key, value in upstream_response.headers.items()
        if key.lower() not in HOP_BY_HOP_HEADERS
    }

    return Response(
        content=upstream_response.content,
        status_code=upstream_response.status_code,
        headers=response_headers,
    )


@app.get("/", tags=["Root"])
async def root() -> dict[str, str]:
    return {
        "service": "api-gateway",
        "docs": "/docs",
    }


@app.get("/health", tags=["Health"])
async def health_check() -> dict[str, str]:
    return {
        "service": "api-gateway",
        "status": "healthy",
    }


@app.get("/parts", tags=["Parts"])
async def list_parts(request: Request) -> Response:
    return await forward_request("GET", "/parts", request)


@app.post("/parts", tags=["Parts"])
async def create_part(request: Request) -> Response:
    return await forward_request("POST", "/parts", request)


@app.get("/parts/search", tags=["Parts"])
async def search_parts(request: Request) -> Response:
    return await forward_request("GET", "/parts/search", request)


@app.get("/parts/{part_id}", tags=["Parts"])
async def get_part(part_id: int, request: Request) -> Response:
    return await forward_request("GET", f"/parts/{part_id}", request)


@app.patch("/parts/{part_id}", tags=["Parts"])
async def update_part(part_id: int, request: Request) -> Response:
    return await forward_request("PATCH", f"/parts/{part_id}", request)


@app.delete(
    "/parts/{part_id}",
    tags=["Parts"],
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_part(part_id: int, request: Request) -> Response:
    return await forward_request("DELETE", f"/parts/{part_id}", request)
