"""Alembic migration script template."""
revision = "0001"
down_revision = None
branch_labels = None
depends_on = None

from alembic import op
import sqlalchemy as sa


def upgrade():
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column("username", sa.String(50), unique=True, nullable=False, index=True),
        sa.Column("password_hash", sa.String(255), nullable=False),
        sa.Column("display_name", sa.String(50), default=""),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now()),
    )
    op.create_table(
        "game_sessions",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("mode", sa.String(10), nullable=False),
        sa.Column("score", sa.Integer(), default=0),
        sa.Column("combo", sa.Integer(), default=0),
        sa.Column("tool", sa.String(30), default="slipper"),
        sa.Column("difficulty", sa.String(10), default="easy"),
        sa.Column("result", sa.String(10), default=""),
        sa.Column("played_at", sa.DateTime(), server_default=sa.func.now()),
    )
    op.create_table(
        "doll_names",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("doll_id", sa.String(50), nullable=False),
        sa.Column("custom_name", sa.String(100), nullable=False),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now()),
    )
    op.create_table(
        "blessings",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("message", sa.Text(), nullable=False),
        sa.Column("paper_doll_id", sa.String(50), default=""),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now()),
    )


def downgrade():
    op.drop_table("blessings")
    op.drop_table("doll_names")
    op.drop_table("game_sessions")
    op.drop_table("users")
