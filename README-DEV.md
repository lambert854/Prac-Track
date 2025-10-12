# FieldTrack Development Setup

## Your Development Workflow (LOCKED IN)

### Environment
- **Local Development**: `vercel dev --listen 3000`
- **Database**: Neon DB (shared between local and production)
- **File Storage**: Vercel Blob
- **Environment Variables**: `.env.local` (not committed to git)

### Quick Start
```powershell
# Use the provided script
.\start-dev.ps1

# Or manually:
vercel dev --listen 3000
```

### Key Files
- `.env.local` - Contains `BLOB_READ_WRITE_TOKEN`
- `src/app/api/placements/[id]/documents/route.ts` - Document upload API
- Database connection: Neon DB (same as production)

### Port Consistency
- **Always use port 3000** for development
- If port conflicts occur, the startup script will clean up existing processes

### Document Uploads
- Uses Vercel Blob storage
- Requires `BLOB_READ_WRITE_TOKEN` in `.env.local`
- API endpoint: `/api/placements/[id]/documents`

### Troubleshooting
1. If 404 errors occur: Clear `.next` cache and restart
2. If upload fails: Check `BLOB_READ_WRITE_TOKEN` in `.env.local`
3. If port conflicts: Use `.\start-dev.ps1` to clean restart
