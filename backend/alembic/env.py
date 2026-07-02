import asyncio
from logging.config import fileConfig
from sqlalchemy import pool
from sqlalchemy.ext.asyncio import create_async_engine
from alembic import context

# Import our settings and database models
from backend.app.config import settings
from backend.app.database import Base
# Make sure models are imported so metadata is registered
from backend.app.models import User, Student, Company, Drive, Application, InterviewRound, InterviewResult

# this is the Alembic Config object
config = context.config

# Interpret the config file for Python logging.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Set the target metadata for autogenerate support
target_metadata = Base.metadata

def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode."""
    url = settings.DATABASE_URL
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection):
    # SQLite doesn't support direct alterations, so we use batch mode when SQLite is detected
    is_sqlite = connection.dialect.name == "sqlite"
    
    context.configure(
        connection=connection,
        target_metadata=target_metadata,
        render_as_batch=is_sqlite
    )

    with context.begin_transaction():
        context.run_migrations()


async def run_migrations_online() -> None:
    """Run migrations in 'online' mode using the async engine."""
    # Create the async engine dynamically from settings
    connectable = create_async_engine(
        settings.DATABASE_URL,
        poolclass=pool.NullPool,
    )

    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)

    await connectable.dispose()


if context.is_offline_mode():
    run_migrations_offline()
else:
    # Run the async loop for online migrations
    asyncio.run(run_migrations_online())
