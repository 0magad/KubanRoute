from fastapi import APIRouter, HTTPException
from fastapi.responses import PlainTextResponse
from core.services.route_generator import get_route_by_token

router = APIRouter()

@router.get("/api/routes/{token}/pdf")
def export_route_to_pdf(token: str):
    """
    Export the generated route as a text-based document.
    (In production, generate a real PDF using reportlab or pdfkit. 
    Using text/plain to simulate PDF download for MVP).
    """
    route = get_route_by_token(token)
    if not route:
        raise HTTPException(status_code=404, detail="Route not found")
        
    doc = f"Маршрут: {route.title}\n"
    doc += f"{'='*40}\n\n"
    doc += f"Описание: {route.intro}\n\n"
    
    for day in route.days:
        doc += f"--- День {day.day_number}: {day.title} ---\n"
        doc += f"{day.description}\n\n"
        for place in day.places:
            doc += f"  * {place.time_start} - {place.time_end} | {place.name}\n"
            if place.short_description:
                doc += f"    {place.short_description}\n"
        doc += "\n"
        
    logistics = route.logistics
    doc += f"\nЛогистика:\n"
    doc += f"- Транспорт: {logistics.transport}\n"
    doc += f"- Проживание: {logistics.accommodation}\n"
    doc += f"- Питание: {logistics.food}\n"

    # Set headers to prompt user for file download
    headers = {
        "Content-Disposition": f'attachment; filename="route_{token}.txt"'
    }
    
    return PlainTextResponse(content=doc, headers=headers)
