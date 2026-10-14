
import os

import httpx
from fastapi import FastAPI, HTTPException, Request, Response, status


PARTS_SERVICE_URL = os.getenv(
    "PARTS_SERVICE_URL",
    "http://parts-service:8001",
).rstrip("/")

WAREHOUSE_SERVICE_URL = os.getenv(
    "WAREHOUSE_SERVICE_URL",
    "http://warehouse-service:8002",
).rstrip("/")

app = FastAPI(
    title="SpareParts API Gateway",
    description="Single entry point for the SpareParts microservices.",
    version="0.2.0",
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
    service_url: str,
    method: str,
    path: str,
    request: Request,
) -> Response:
    """Forward a request to the selected microservice."""

    url = f"{service_url}{path}"

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
            detail="The requested service timed out.",
        ) from None

    except httpx.RequestError:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="The requested service is unavailable.",
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


# Parts Service routes

@app.get("/parts", tags=["Parts"])
async def list_parts(request: Request) -> Response:
    return await forward_request(
        PARTS_SERVICE_URL,
        "GET",
        "/parts",
        request,
    )


@app.post("/parts", tags=["Parts"])
async def create_part(request: Request) -> Response:
    return await forward_request(
        PARTS_SERVICE_URL,
        "POST",
        "/parts",
        request,
    )


@app.get("/parts/search", tags=["Parts"])
async def search_parts(request: Request) -> Response:
    return await forward_request(
        PARTS_SERVICE_URL,
        "GET",
        "/parts/search",
        request,
    )


@app.get("/parts/{part_id}", tags=["Parts"])
async def get_part(part_id: int, request: Request) -> Response:
    return await forward_request(
        PARTS_SERVICE_URL,
        "GET",
        f"/parts/{part_id}",
        request,
    )


@app.patch("/parts/{part_id}", tags=["Parts"])
async def update_part(part_id: int, request: Request) -> Response:
    return await forward_request(
        PARTS_SERVICE_URL,
        "PATCH",
        f"/parts/{part_id}",
        request,
    )


@app.delete(
    "/parts/{part_id}",
    tags=["Parts"],
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_part(part_id: int, request: Request) -> Response:
    return await forward_request(
        PARTS_SERVICE_URL,
        "DELETE",
        f"/parts/{part_id}",
        request,
    )


# Warehouse Service routes

@app.get("/warehouses", tags=["Warehouses"])
async def list_warehouses(request: Request) -> Response:
    return await forward_request(
        WAREHOUSE_SERVICE_URL,
        "GET",
        "/warehouses",
        request,
    )


@app.post(
    "/warehouses",
    tags=["Warehouses"],
    status_code=status.HTTP_201_CREATED,
)
async def create_warehouse(request: Request) -> Response:
    return await forward_request(
        WAREHOUSE_SERVICE_URL,
        "POST",
        "/warehouses",
        request,
    )


@app.get("/warehouses/search", tags=["Warehouses"])
async def search_warehouses(request: Request) -> Response:
    return await forward_request(
        WAREHOUSE_SERVICE_URL,
        "GET",
        "/warehouses/search",
        request,
    )


@app.get("/warehouses/{warehouse_id}", tags=["Warehouses"])
async def get_warehouse(
    warehouse_id: str,
    request: Request,
) -> Response:
    return await forward_request(
        WAREHOUSE_SERVICE_URL,
        "GET",
        f"/warehouses/{warehouse_id}",
        request,
    )


@app.patch("/warehouses/{warehouse_id}", tags=["Warehouses"])
async def update_warehouse(
    warehouse_id: str,
    request: Request,
) -> Response:
    return await forward_request(
        WAREHOUSE_SERVICE_URL,
        "PATCH",
        f"/warehouses/{warehouse_id}",
        request,
    )


@app.delete(
    "/warehouses/{warehouse_id}",
    tags=["Warehouses"],
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_warehouse(
    warehouse_id: str,
    request: Request,
) -> Response:
    return await forward_request(
        WAREHOUSE_SERVICE_URL,
        "DELETE",
        f"/warehouses/{warehouse_id}",
        request,
    )
