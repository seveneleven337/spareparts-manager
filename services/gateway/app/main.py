
import os

import httpx
from fastapi import FastAPI, HTTPException, Request, Response
from fastapi.middleware.cors import CORSMiddleware


PARTS_SERVICE_URL = os.getenv(
    "PARTS_SERVICE_URL",
    "http://parts-service:8001",
).rstrip("/")

WAREHOUSE_SERVICE_URL = os.getenv(
    "WAREHOUSE_SERVICE_URL",
    "http://warehouse-service:8002",
).rstrip("/")

EMPLOYEE_SERVICE_URL = os.getenv(
    "EMPLOYEE_SERVICE_URL",
    "http://employee-service:8003",
).rstrip("/")

GATEWAY_TIMEOUT = float(os.getenv("GATEWAY_TIMEOUT", "10.0"))

HOP_BY_HOP_HEADERS = {
    "connection",
    "keep-alive",
    "proxy-authenticate",
    "proxy-authorization",
    "te",
    "trailers",
    "transfer-encoding",
    "upgrade",
    "host",
}


app = FastAPI(
    title="SpareParts Manager API Gateway",
    description="Single entry point for the application's backend services.",
    version="0.4.0",
)

# Allow the local Next.js development server to call the API Gateway.
# Add any additional frontend origins here if your setup requires them.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://172.20.10.2:3000",
    ],
    allow_credentials=False,
    allow_methods=[
        "GET",
        "POST",
        "PATCH",
        "DELETE",
        "OPTIONS",
    ],
    allow_headers=[
        "Accept",
        "Content-Type",
        "Authorization",
    ],
)


@app.get("/", tags=["Root"])
def root() -> dict[str, str]:
    return {
        "service": "api-gateway",
        "docs": "/docs",
        "health": "/health",
    }


@app.get("/health", tags=["Health"])
def health_check() -> dict[str, str]:
    return {
        "service": "api-gateway",
        "status": "healthy",
    }


async def forward_request(
    service_url: str,
    path: str,
    request: Request,
) -> Response:
    """Forward an HTTP request to the selected backend service."""

    url = f"{service_url}{path}"

    request_headers = {
        key: value
        for key, value in request.headers.items()
        if key.lower() not in HOP_BY_HOP_HEADERS
    }

    try:
        async with httpx.AsyncClient(
            timeout=GATEWAY_TIMEOUT,
            follow_redirects=False,
        ) as client:
            upstream_response = await client.request(
                method=request.method,
                url=url,
                params=request.query_params,
                content=await request.body(),
                headers=request_headers,
            )

    except httpx.TimeoutException:
        raise HTTPException(
            status_code=504,
            detail="The backend service timed out.",
        ) from None

    except httpx.RequestError:
        raise HTTPException(
            status_code=502,
            detail="The backend service is unavailable.",
        ) from None

    response_headers = {
        key: value
        for key, value in upstream_response.headers.items()
        if key.lower() not in HOP_BY_HOP_HEADERS
        and key.lower() not in {
            "content-length",
            "content-encoding",
        }
    }

    return Response(
        content=upstream_response.content,
        status_code=upstream_response.status_code,
        headers=response_headers,
    )


@app.api_route(
    "/parts",
    methods=["GET", "POST"],
    tags=["Parts"],
)
async def parts_collection(request: Request) -> Response:
    return await forward_request(
        PARTS_SERVICE_URL,
        "/parts",
        request,
    )


@app.api_route(
    "/parts/search",
    methods=["GET"],
    tags=["Parts"],
)
async def search_parts(request: Request) -> Response:
    return await forward_request(
        PARTS_SERVICE_URL,
        "/parts/search",
        request,
    )


@app.api_route(
    "/parts/{part_id}",
    methods=["GET", "PATCH", "DELETE"],
    tags=["Parts"],
)
async def part_by_id(
    part_id: int,
    request: Request,
) -> Response:
    return await forward_request(
        PARTS_SERVICE_URL,
        f"/parts/{part_id}",
        request,
    )


@app.api_route(
    "/warehouses",
    methods=["GET", "POST"],
    tags=["Warehouses"],
)
async def warehouses_collection(request: Request) -> Response:
    return await forward_request(
        WAREHOUSE_SERVICE_URL,
        "/warehouses",
        request,
    )


@app.api_route(
    "/warehouses/search",
    methods=["GET"],
    tags=["Warehouses"],
)
async def search_warehouses(request: Request) -> Response:
    return await forward_request(
        WAREHOUSE_SERVICE_URL,
        "/warehouses/search",
        request,
    )


@app.api_route(
    "/warehouses/{warehouse_id}",
    methods=["GET", "PATCH", "DELETE"],
    tags=["Warehouses"],
)
async def warehouse_by_id(
    warehouse_id: str,
    request: Request,
) -> Response:
    return await forward_request(
        WAREHOUSE_SERVICE_URL,
        f"/warehouses/{warehouse_id}",
        request,
    )


@app.api_route(
    "/employees",
    methods=["GET", "POST"],
    tags=["Employees"],
)
async def employees_collection(request: Request) -> Response:
    return await forward_request(
        EMPLOYEE_SERVICE_URL,
        "/employees",
        request,
    )


@app.api_route(
    "/employees/search",
    methods=["GET"],
    tags=["Employees"],
)
async def search_employees(request: Request) -> Response:
    return await forward_request(
        EMPLOYEE_SERVICE_URL,
        "/employees/search",
        request,
    )


@app.api_route(
    "/employees/{employee_id}",
    methods=["GET", "PATCH", "DELETE"],
    tags=["Employees"],
)
async def employee_by_id(
    employee_id: int,
    request: Request,
) -> Response:
    return await forward_request(
        EMPLOYEE_SERVICE_URL,
        f"/employees/{employee_id}",
        request,
    )
