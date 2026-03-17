#!/bin/bash
# Car Repair System - Docker Management Scripts
# Run these from the project root directory

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Car Repair System Docker Manager ===${NC}\n"

# Show usage
if [ -z "$1" ]; then
    echo "Usage: $0 {start|stop|restart|logs|clean|backup|restore|status|build}"
    echo ""
    echo "Commands:"
    echo "  start      - Start all services"
    echo "  stop       - Stop all services"
    echo "  restart    - Restart all services"
    echo "  logs       - Show live logs from all services"
    echo "  clean      - Stop and remove containers"
    echo "  backup     - Backup PostgreSQL database"
    echo "  restore    - Restore PostgreSQL database from backup"
    echo "  status     - Show status of all services"
    echo "  build      - Rebuild all containers"
    exit 0
fi

case "$1" in
    start)
        echo -e "${BLUE}Starting all services...${NC}"
        docker-compose up -d
        echo -e "${GREEN}✓ All services started!${NC}"
        echo ""
        echo "Access at:"
        echo "  Frontend: http://localhost"
        echo "  Backend:  http://localhost:3000"
        echo "  pgAdmin:  http://localhost:5050"
        ;;

    stop)
        echo -e "${YELLOW}Stopping all services...${NC}"
        docker-compose down
        echo -e "${GREEN}✓ All services stopped!${NC}"
        ;;

    restart)
        echo -e "${YELLOW}Restarting all services...${NC}"
        docker-compose down
        docker-compose up -d
        echo -e "${GREEN}✓ All services restarted!${NC}"
        ;;

    logs)
        echo -e "${BLUE}Showing live logs (Ctrl+C to exit)...${NC}"
        docker-compose logs -f
        ;;

    clean)
        echo -e "${RED}WARNING: This will remove all containers and networks!${NC}"
        read -p "Are you sure? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            docker-compose down
            echo -e "${GREEN}✓ Cleaned up!${NC}"
        fi
        ;;

    backup)
        TIMESTAMP=$(date +%Y%m%d_%H%M%S)
        BACKUP_FILE="car_repair_backup_${TIMESTAMP}.sql"
        echo -e "${BLUE}Creating database backup: ${BACKUP_FILE}${NC}"
        docker-compose exec postgres pg_dump -U postgres car_repair > "$BACKUP_FILE"
        echo -e "${GREEN}✓ Backup created: ${BACKUP_FILE}${NC}"
        ;;

    restore)
        if [ -z "$2" ]; then
            echo -e "${RED}Please provide backup file: $0 restore <backup_file>${NC}"
            echo "Example: $0 restore car_repair_backup_20240210_123456.sql"
            exit 1
        fi

        if [ ! -f "$2" ]; then
            echo -e "${RED}Backup file not found: $2${NC}"
            exit 1
        fi

        echo -e "${YELLOW}WARNING: This will overwrite the current database!${NC}"
        read -p "Are you sure? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            echo -e "${BLUE}Restoring database from: $2${NC}"
            docker-compose exec -T postgres psql -U postgres car_repair < "$2"
            echo -e "${GREEN}✓ Database restored!${NC}"
        fi
        ;;

    status)
        echo -e "${BLUE}Service Status:${NC}"
        docker-compose ps
        ;;

    build)
        echo -e "${BLUE}Building containers (this may take a few minutes)...${NC}"
        docker-compose build --no-cache
        echo -e "${GREEN}✓ Build complete!${NC}"
        ;;

    *)
        echo -e "${RED}Unknown command: $1${NC}"
        echo "Use: $0 {start|stop|restart|logs|clean|backup|restore|status|build}"
        exit 1
        ;;
esac
