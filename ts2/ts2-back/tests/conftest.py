import pytest
import pytest_asyncio 
from httpx import AsyncClient, ASGITransport
from app.main import app 

@pytest_asyncio.fixture(scope="function")
async def client():
    """Fixture que cria um cliente HTTP para disparar as requisições"""
    async with AsyncClient(
        transport=ASGITransport(app=app), 
        base_url="http://test"
    ) as ac:
        yield ac