// Serviços para operações do usuário atual (client-side)
export { UserService } from './userService'
export { InstanceService } from './instanceService'
export { GroupService } from './groupService'
export { DashboardService } from './dashboardService'

// ⚠️ ATENÇÃO: Serviços server-side não devem ser exportados aqui
// - PlanService: usado apenas em API routes
// - AdminService: usado apenas em API routes e Server Components
