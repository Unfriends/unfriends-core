import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { UnfriendsComponent } from './unfriends.component';

const routes: Routes = [
  { path: ':id', component: UnfriendsComponent },
  { path: '**', redirectTo: '', },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {
  public static forRoot(a: any, b: any) {
    console.log(a, b);
  }
}
