from uuid import UUID
from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.core.dependencies import DB, CurrentUser, AgentUser, LandlordOrAgentUser
from app.models.inquiry import Inquiry, LeadTimeline
from app.models.property import Property
from app.models.notification import Notification
from app.models.user import User
from app.core.email import send_email
from app.schemas.inquiry import (
    InquiryCreate,
    InquiryResponseOut,
    InquiryUpdate,
    TimelineEventCreate,
    TimelineEventResponse,
    LeadDetailResponse,
)
from app.schemas.responses import APIResponse

from app.core.notifications import manager as notification_manager

router = APIRouter(prefix="/inquiries", tags=["Inquiries & Leads"])


@router.post("/", response_model=InquiryResponseOut, status_code=status.HTTP_201_CREATED)
async def create_inquiry(
    body: InquiryCreate,
    db: DB,
):
    result = await db.execute(select(Property).where(Property.id == body.property_id))
    prop = result.scalar_one_or_none()
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")

    inquiry = Inquiry(
        property_id=body.property_id,
        sender_name=body.sender_name,
        sender_email=body.sender_email,
        sender_phone=body.sender_phone,
        message=body.message,
        inquiry_type=body.inquiry_type,
        status="new",
    )
    db.add(inquiry)
    prop.inquiry_count += 1

    recipients = [prop.owner_id]
    if prop.agent_id and prop.agent_id not in recipients:
        recipients.append(prop.agent_id)

    for user_id in recipients:
        # Get user email
        user = await db.scalar(select(User).where(User.id == user_id))

        db.add(Notification(
            user_id=user_id,
            type="new_inquiry",
            title="New property inquiry",
            body=f"{body.sender_name} asked about {prop.title}",
            link="/dashboard/landlord",
            data={"property_id": str(prop.id)},
        ))
        # Real-time push via WebSocket
        await notification_manager.send_personal_message(
            {"type": "new_inquiry", "title": "New property inquiry", "body": f"{body.sender_name} asked about {prop.title}"},
            str(user_id)
        )

        if user:
            await send_email(
                to_email=user.email,
                subject="New Inquiry for your property",
                body=f"Hello {user.full_name},\n\n{body.sender_name} has expressed interest in your property: {prop.title}.\n\nMessage: {body.message}\n\nLogin to your dashboard to respond."
            )

    await db.commit()
    await db.refresh(inquiry)
    return inquiry


@router.get("/", response_model=APIResponse[list[LeadDetailResponse]])
async def list_leads(
    db: DB,
    current_user: LandlordOrAgentUser,
):
    query = (
        select(Inquiry)
        .options(
            selectinload(Inquiry.property),
            selectinload(Inquiry.timeline_events)
        )
    )

    if current_user.role == "landlord":
        query = query.join(Property).where(Property.owner_id == current_user.id)
        
    query = query.order_by(Inquiry.created_at.desc())
    result = await db.execute(query)
    
    inquiries = result.scalars().all()
    return APIResponse(data=[
        LeadDetailResponse(
            id=inq.id,
            property_id=inq.property_id,
            sender_name=inq.sender_name,
            sender_email=inq.sender_email,
            sender_phone=inq.sender_phone,
            message=inq.message,
            status=inq.status,
            created_at=inq.created_at,
            property_title=inq.property.title if inq.property else None,
            timeline_events=[
                TimelineEventResponse(
                    id=ev.id,
                    inquiry_id=ev.inquiry_id,
                    event_type=ev.event_type,
                    note=ev.note,
                    created_by_id=ev.created_by_id,
                    created_at=ev.created_at,
                )
                for ev in inq.timeline_events
            ],
        )
        for inq in inquiries
    ])



@router.get("/{inquiry_id}", response_model=LeadDetailResponse)
async def get_lead_detail(
    inquiry_id: UUID,
    db: DB,
    current_user: LandlordOrAgentUser,
):
    query = (
        select(Inquiry)
        .options(
            selectinload(Inquiry.property),
            selectinload(Inquiry.timeline_events).selectinload(LeadTimeline.created_by),
        )
        .where(Inquiry.id == inquiry_id)
    )
    
    if current_user.role == "landlord":
        query = query.join(Property).where(Property.owner_id == current_user.id)
        
    result = await db.execute(query)
    inquiry = result.scalar_one_or_none()
    if not inquiry:
        raise HTTPException(status_code=404, detail="Lead not found")

    return LeadDetailResponse(
        id=inquiry.id,
        property_id=inquiry.property_id,
        sender_name=inquiry.sender_name,
        sender_email=inquiry.sender_email,
        sender_phone=inquiry.sender_phone,
        message=inquiry.message,
        status=inquiry.status,
        created_at=inquiry.created_at,
        property_title=inquiry.property.title if inquiry.property else None,
        timeline_events=[
            TimelineEventResponse(
                id=ev.id,
                inquiry_id=ev.inquiry_id,
                event_type=ev.event_type,
                note=ev.note,
                created_by_id=ev.created_by_id,
                created_at=ev.created_at,
            )
            for ev in inquiry.timeline_events
        ],
    )


@router.patch("/{inquiry_id}/status", response_model=LeadDetailResponse)
async def update_lead(
    inquiry_id: UUID,
    body: InquiryUpdate,
    db: DB,
    current_user: LandlordOrAgentUser,
):
    query = (
        select(Inquiry)
        .options(
            selectinload(Inquiry.property),
            selectinload(Inquiry.timeline_events).selectinload(LeadTimeline.created_by),
        )
        .where(Inquiry.id == inquiry_id)
    )
    if current_user.role == "landlord":
        query = query.join(Property).where(Property.owner_id == current_user.id)
        
    result = await db.execute(query)
    inquiry = result.scalar_one_or_none()
    if not inquiry:
        raise HTTPException(status_code=404, detail="Lead not found")

    if body.status:
        old_status = inquiry.status
        inquiry.status = body.status
        timeline_entry = LeadTimeline(
            inquiry_id=inquiry_id,
            event_type="status_change",
            note=f"Status changed from {old_status} to {body.status}",
            created_by_id=current_user.id,
        )
        db.add(timeline_entry)
    
    if body.priority:
        inquiry.priority = body.priority
        
    if body.follow_up_at:
        inquiry.follow_up_at = body.follow_up_at
        timeline_entry = LeadTimeline(
            inquiry_id=inquiry_id,
            event_type="follow_up",
            note=f"Follow-up scheduled for {body.follow_up_at.date()}",
            created_by_id=current_user.id,
        )
        db.add(timeline_entry)

    await db.commit()
    await db.refresh(inquiry)
    return inquiry


@router.post(
    "/{inquiry_id}/timeline",
    response_model=TimelineEventResponse,
    status_code=status.HTTP_201_CREATED,
)
async def add_timeline_event(
    inquiry_id: UUID,
    body: TimelineEventCreate,
    db: DB,
    current_user: LandlordOrAgentUser,
):
    query = select(Inquiry).where(Inquiry.id == inquiry_id)
    if current_user.role == "landlord":
        query = query.join(Property).where(Property.owner_id == current_user.id)
        
    result = await db.execute(query)
    inquiry = result.scalar_one_or_none()
    if not inquiry:
        raise HTTPException(status_code=404, detail="Lead not found")

    event = LeadTimeline(
        inquiry_id=inquiry_id,
        event_type=body.event_type,
        note=body.note,
        created_by_id=current_user.id,
    )
    db.add(event)
    await db.commit()
    await db.refresh(event)
    return event


@router.get("/{inquiry_id}/timeline", response_model=list[TimelineEventResponse])
async def list_timeline_events(
    inquiry_id: UUID,
    db: DB,
    current_user: AgentUser,
):
    result = await db.execute(
        select(LeadTimeline)
        .where(LeadTimeline.inquiry_id == inquiry_id)
        .order_by(LeadTimeline.created_at.asc())
    )
    return result.scalars().all()
