import { Routes } from '@angular/router';
import { DashboardComponent } from './dashboard/dashboard.component';
import { DiagramComponent } from './diagram/diagram.component';
import { DbContextViewComponent } from './dbcontext-view/dbcontext-view.component';
import { EntityViewComponent } from './entity-view/entity-view.component';
import { EntityFormRouteComponent } from './entity-form-route/entity-form-route.component';

export const routes: Routes = [
  { 
    path: '', 
    component: DashboardComponent,
    children: [
      { path: 'dbcontext/:dbContext', component: DbContextViewComponent },
      { path: 'entity/:entityName', component: EntityViewComponent },
      { path: 'entity/:entityName/create', component: EntityFormRouteComponent },
      { path: 'entity/:entityName/edit/:id', component: EntityFormRouteComponent }
    ]
  },
  { path: 'diagram', component: DiagramComponent },
  { path: '**', redirectTo: '' }
];
