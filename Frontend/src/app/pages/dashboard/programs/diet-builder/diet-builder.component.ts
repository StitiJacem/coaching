import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { DietService, DietPlan, DietDay, Meal } from '../../../../services/diet.service';
import { DashboardLayoutComponent } from '../../../../components/dashboard-layout/dashboard-layout.component';

@Component({
  selector: 'app-diet-builder',
  standalone: true,
  imports: [CommonModule, FormsModule, DashboardLayoutComponent, RouterLink],
  templateUrl: './diet-builder.component.html',
  styleUrls: ['./diet-builder.component.css']
})
export class DietBuilderComponent implements OnInit {
  planData: DietPlan = {
    name: 'New Diet Plan',
    description: '',
    goal: 'Maintenance',
    isTemplate: true,
    days: []
  };

  activeDayIndex: number = 0;

  constructor(private dietService: DietService, private router: Router) {}

  ngOnInit() {
    this.addDay();
  }

  addDay() {
    const newDay: DietDay = {
      day_number: this.planData.days!.length + 1,
      title: `Day ${this.planData.days!.length + 1}`,
      isRestDay: false,
      meals: []
    };
    this.planData.days!.push(newDay);
    this.activeDayIndex = this.planData.days!.length - 1;
  }

  removeDay(index: number) {
    this.planData.days!.splice(index, 1);
    if (this.activeDayIndex >= this.planData.days!.length) {
      this.activeDayIndex = Math.max(0, this.planData.days!.length - 1);
    }
  }

  addMeal(dayIndex: number) {
    const newMeal: any = {
      mealType: 'Snack',
      timeOfDay: '12:00',
      instructions: '',
      calories: 0,
      protein: 0,
      carbs: 0,
      fats: 0,
      order: this.planData.days![dayIndex].meals!.length
    };
    this.planData.days![dayIndex].meals!.push(newMeal);
  }

  removeMeal(dayIndex: number, mealIndex: number) {
    this.planData.days![dayIndex].meals!.splice(mealIndex, 1);
  }

  savePlan() {

    if (!this.planData.name) {
      alert('Plan must have a name');
      return;
    }

    this.dietService.createPlan({
      name: this.planData.name,
      description: this.planData.description,
      goal: this.planData.goal,
      isTemplate: true
    }).subscribe({
      next: (plan) => {
        if (plan.id) {
          const daysToSave = this.planData.days.map((day) => {
             const { title, ...rest } = day;
             return { ...rest, meals: day.meals.map(m => {
                 const { order, ...mRest } = m as any;
                 return mRest;
             })};
          });

          this.dietService.saveFullPlan(plan.id, this.planData.name, daysToSave as any).subscribe({
            next: () => {
              alert('Plan saved successfully!');
              this.router.navigate(['/dashboard']);
            },
            error: (err: any) => alert('Failed to save structure')
          });
        }
      },
      error: (err: any) => {
        console.error('Save error', err);
        alert('Failed to create plan');
      }
    });
  }
}
