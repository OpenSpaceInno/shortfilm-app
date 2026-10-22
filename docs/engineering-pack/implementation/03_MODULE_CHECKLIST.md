# MODULE IMPLEMENTATION CHECKLIST

## Per-Module Definition of Done

For each module, Claude must complete ALL items before marking COMPLETE:

### Code
- [ ] Module class + module registration in AppModule
- [ ] Controller(s) with all endpoints from 05_API_SPECIFICATION.md
- [ ] Service(s) with full business logic
- [ ] Repository(ies) with all DB operations
- [ ] DTOs for all request/response shapes
- [ ] Class-validator decorators on all request DTOs
- [ ] @Exclude() on all sensitive response DTO fields
- [ ] OpenAPI annotations (@ApiOperation, @ApiResponse) on all endpoints

### Database
- [ ] Drizzle schema definitions for all entities
- [ ] Migration file(s) created and tested
- [ ] All FK constraints defined
- [ ] All required indexes defined
- [ ] Migration verified against real MySQL 8.x container

### Auth & Security
- [ ] All endpoints protected by appropriate guards
- [ ] Audit logging for all admin/privileged mutations
- [ ] No sensitive data in error responses

### Tests
- [ ] Unit tests for all service methods with business logic (>= 80% coverage)
- [ ] Integration test for each repository method (real MySQL container)
- [ ] API test for each endpoint (success + auth error + validation error)

### Documentation
- [ ] JSDoc on all service methods
- [ ] MODULE COMPLETION REPORT output
- [ ] 05_PROGRESS_TRACKER.md updated
