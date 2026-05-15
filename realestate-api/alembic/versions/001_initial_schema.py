"""Initial schema - all tables

Revision ID: 001_initial_schema
Revises: 
Create Date: 2026-04-25
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = '001_initial_schema'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ── users ──
    op.create_table('users',
        sa.Column('id', postgresql.UUID(as_uuid=True), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('email', sa.String(255), nullable=False),
        sa.Column('password_hash', sa.String(255), nullable=False),
        sa.Column('full_name', sa.String(255), nullable=False),
        sa.Column('phone', sa.String(30)),
        sa.Column('role', sa.String(20), nullable=False),
        sa.Column('avatar_url', sa.Text),
        sa.Column('bio', sa.Text),
        sa.Column('is_active', sa.Boolean, nullable=False, server_default='true'),
        sa.Column('is_verified', sa.Boolean, nullable=False, server_default='false'),
        sa.Column('last_login_at', sa.DateTime(timezone=True)),
        sa.Column('deleted_at', sa.DateTime(timezone=True)),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('email', name='users_email_unique'),
        sa.CheckConstraint("role IN ('landlord','agent','admin')", name='ck_users_role'),
    )
    op.create_index('idx_users_email', 'users', ['email'])
    op.create_index('idx_users_role', 'users', ['role'])

    # ── email_verifications ──
    op.create_table('email_verifications',
        sa.Column('id', postgresql.UUID(as_uuid=True), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('token', sa.String(255), nullable=False),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('used', sa.Boolean, nullable=False, server_default='false'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('token'),
    )

    # ── password_reset_tokens ──
    op.create_table('password_reset_tokens',
        sa.Column('id', postgresql.UUID(as_uuid=True), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('token', sa.String(255), nullable=False),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('used', sa.Boolean, nullable=False, server_default='false'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('token'),
    )

    # ── refresh_tokens ──
    op.create_table('refresh_tokens',
        sa.Column('id', postgresql.UUID(as_uuid=True), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('token_hash', sa.String(255), nullable=False),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('revoked', sa.Boolean, nullable=False, server_default='false'),
        sa.Column('user_agent', sa.String(500)),
        sa.Column('ip_address', sa.String(45)),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('token_hash'),
    )

    # ── agent_landlord_links ──
    op.create_table('agent_landlord_links',
        sa.Column('id', postgresql.UUID(as_uuid=True), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('agent_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('landlord_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('status', sa.String(20), nullable=False, server_default='pending'),
        sa.Column('invited_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('accepted_at', sa.DateTime(timezone=True)),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(['agent_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['landlord_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('agent_id', 'landlord_id', name='uq_agent_landlord'),
    )

    # ── properties ──
    op.create_table('properties',
        sa.Column('id', postgresql.UUID(as_uuid=True), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('owner_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('agent_id', postgresql.UUID(as_uuid=True)),
        sa.Column('title', sa.String(255), nullable=False),
        sa.Column('description', sa.Text),
        sa.Column('property_type', sa.String(30), nullable=False),
        sa.Column('listing_type', sa.String(10), nullable=False),
        sa.Column('price', sa.Numeric(14, 2), nullable=False),
        sa.Column('price_period', sa.String(15), nullable=False, server_default='monthly'),
        sa.Column('price_negotiable', sa.Boolean, nullable=False, server_default='false'),
        sa.Column('bedrooms', sa.SmallInteger),
        sa.Column('bathrooms', sa.SmallInteger),
        sa.Column('toilets', sa.SmallInteger),
        sa.Column('area_sqm', sa.Numeric(10, 2)),
        sa.Column('floors', sa.SmallInteger),
        sa.Column('address', sa.Text, nullable=False),
        sa.Column('landmark', sa.String(255)),
        sa.Column('lga', sa.String(100)),
        sa.Column('city', sa.String(100), nullable=False),
        sa.Column('state', sa.String(100), nullable=False),
        sa.Column('country', sa.String(60), nullable=False, server_default='Nigeria'),
        sa.Column('latitude', sa.Numeric(10, 7)),
        sa.Column('longitude', sa.Numeric(10, 7)),
        sa.Column('amenities', postgresql.JSONB, nullable=False, server_default='[]'),
        sa.Column('video_url', sa.Text),
        sa.Column('status', sa.String(20), nullable=False, server_default='draft'),
        sa.Column('featured', sa.Boolean, nullable=False, server_default='false'),
        sa.Column('featured_until', sa.DateTime(timezone=True)),
        sa.Column('rejection_note', sa.Text),
        sa.Column('moderated_by', postgresql.UUID(as_uuid=True)),
        sa.Column('moderated_at', sa.DateTime(timezone=True)),
        sa.Column('view_count', sa.Integer, nullable=False, server_default='0'),
        sa.Column('inquiry_count', sa.Integer, nullable=False, server_default='0'),
        sa.Column('published_at', sa.DateTime(timezone=True)),
        sa.Column('deleted_at', sa.DateTime(timezone=True)),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(['owner_id'], ['users.id']),
        sa.ForeignKeyConstraint(['agent_id'], ['users.id']),
        sa.ForeignKeyConstraint(['moderated_by'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('idx_prop_owner', 'properties', ['owner_id'], postgresql_where=sa.text("deleted_at IS NULL"))
    op.create_index('idx_prop_agent', 'properties', ['agent_id'], postgresql_where=sa.text("deleted_at IS NULL"))
    op.create_index('idx_prop_status', 'properties', ['status'], postgresql_where=sa.text("deleted_at IS NULL"))
    op.create_index('idx_prop_city', 'properties', ['city'], postgresql_where=sa.text("deleted_at IS NULL"))
    op.create_index('idx_prop_state', 'properties', ['state'], postgresql_where=sa.text("deleted_at IS NULL"))
    op.create_index('idx_prop_featured', 'properties', ['featured'], postgresql_where=sa.text("status = 'approved'"))
    op.execute("CREATE INDEX idx_prop_amenities ON properties USING GIN(amenities)")

    # Full-text search vector
    op.execute("""
        ALTER TABLE properties ADD COLUMN search_vector tsvector
        GENERATED ALWAYS AS (
            setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
            setweight(to_tsvector('english', coalesce(city, '')), 'B') ||
            setweight(to_tsvector('english', coalesce(state, '')), 'B') ||
            setweight(to_tsvector('english', coalesce(lga, '')), 'B') ||
            setweight(to_tsvector('english', coalesce(description, '')), 'C')
        ) STORED
    """)
    op.execute("CREATE INDEX idx_prop_search ON properties USING GIN(search_vector)")

    # ── property_images ──
    op.create_table('property_images',
        sa.Column('id', postgresql.UUID(as_uuid=True), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('property_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('url', sa.Text, nullable=False),
        sa.Column('storage_key', sa.Text),
        sa.Column('caption', sa.String(255)),
        sa.Column('is_primary', sa.Boolean, nullable=False, server_default='false'),
        sa.Column('sort_order', sa.SmallInteger, nullable=False, server_default='0'),
        sa.Column('width', sa.Integer),
        sa.Column('height', sa.Integer),
        sa.Column('size_bytes', sa.Integer),
        sa.Column('uploaded_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(['property_id'], ['properties.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('idx_pimg_property', 'property_images', ['property_id'])
    op.execute("""
        CREATE UNIQUE INDEX idx_pimg_primary ON property_images(property_id)
        WHERE is_primary = TRUE
    """)

    # ── inquiries ──
    op.create_table('inquiries',
        sa.Column('id', postgresql.UUID(as_uuid=True), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('property_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('sender_name', sa.String(255), nullable=False),
        sa.Column('sender_email', sa.String(255), nullable=False),
        sa.Column('sender_phone', sa.String(30)),
        sa.Column('message', sa.Text, nullable=False),
        sa.Column('inquiry_type', sa.String(20), nullable=False, server_default='general'),
        sa.Column('status', sa.String(20), nullable=False, server_default='new'),
        sa.Column('priority', sa.String(10), nullable=False, server_default='normal'),
        sa.Column('assigned_to', postgresql.UUID(as_uuid=True)),
        sa.Column('read_at', sa.DateTime(timezone=True)),
        sa.Column('replied_at', sa.DateTime(timezone=True)),
        sa.Column('closed_at', sa.DateTime(timezone=True)),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(['property_id'], ['properties.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['assigned_to'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('idx_inq_property', 'inquiries', ['property_id'])
    op.create_index('idx_inq_status', 'inquiries', ['status'])

    # ── inquiry_responses ──
    op.create_table('inquiry_responses',
        sa.Column('id', postgresql.UUID(as_uuid=True), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('inquiry_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('responder_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('message', sa.Text, nullable=False),
        sa.Column('sent_via', sa.String(20), nullable=False, server_default='platform'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(['inquiry_id'], ['inquiries.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['responder_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
    )

    # ── saved_properties ──
    op.create_table('saved_properties',
        sa.Column('id', postgresql.UUID(as_uuid=True), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('property_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('saved_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['property_id'], ['properties.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', 'property_id', name='uq_saved_property'),
    )

    # ── notifications ──
    op.create_table('notifications',
        sa.Column('id', postgresql.UUID(as_uuid=True), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('type', sa.String(50), nullable=False),
        sa.Column('title', sa.String(255), nullable=False),
        sa.Column('body', sa.Text),
        sa.Column('link', sa.Text),
        sa.Column('is_read', sa.Boolean, nullable=False, server_default='false'),
        sa.Column('read_at', sa.DateTime(timezone=True)),
        sa.Column('data', postgresql.JSONB),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('idx_notif_unread', 'notifications', ['user_id'], postgresql_where=sa.text("is_read = FALSE"))

    # ── audit_log ──
    op.create_table('audit_log',
        sa.Column('id', postgresql.UUID(as_uuid=True), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('actor_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('action', sa.String(100), nullable=False),
        sa.Column('target_type', sa.String(50)),
        sa.Column('target_id', postgresql.UUID(as_uuid=True)),
        sa.Column('before_data', postgresql.JSONB),
        sa.Column('after_data', postgresql.JSONB),
        sa.Column('note', sa.Text),
        sa.Column('ip_address', sa.String(45)),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(['actor_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('idx_audit_actor', 'audit_log', ['actor_id'])
    op.create_index('idx_audit_action', 'audit_log', ['action'])


def downgrade() -> None:
    op.drop_table('audit_log')
    op.drop_table('notifications')
    op.drop_table('saved_properties')
    op.drop_table('inquiry_responses')
    op.drop_table('inquiries')
    op.drop_table('property_images')
    op.drop_table('properties')
    op.drop_table('agent_landlord_links')
    op.drop_table('refresh_tokens')
    op.drop_table('password_reset_tokens')
    op.drop_table('email_verifications')
    op.drop_table('users')
