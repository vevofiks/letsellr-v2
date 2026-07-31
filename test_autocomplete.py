import asyncio
from app.db.session import async_session_maker
from sqlalchemy import select, or_, func
from app.modules.properties.models import Property

async def main():
    async with async_session_maker() as db:
        query = "ko"
        # We want to find distinct combinations of location_area and location_city
        # that match the query.
        stmt = (
            select(Property.location_area, Property.location_city)
            .where(
                or_(
                    Property.location_area.ilike(f"%{query}%"),
                    Property.location_city.ilike(f"%{query}%")
                )
            )
            .where(Property.status == "live")
            .distinct()
            .limit(10)
        )
        result = await db.execute(stmt)
        rows = result.all()
        
        locations = []
        for area, city in rows:
            if area and area.lower() != city.lower():
                locations.append(f"{area}, {city}")
            else:
                locations.append(city)
                
        print(list(set(locations)))

asyncio.run(main())
