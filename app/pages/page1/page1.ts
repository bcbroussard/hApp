import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import { Backand } from '../../services/backand';

@Component({
  templateUrl: 'build/pages/page1/page1.html'
})
export class Page1 {

  private BK: Backand;
  public items: any[];

  constructor(public navCtrl: NavController, public backand: Backand) {
    this.BK = backand;
    this.BK.getTodos().subscribe(
      data => {
        console.log("subscribe", data);
        this.items = data.data;
      },
      err => console.error(err),
      () => console.log('OK')
    );
  }

  public addTodo() {
    console.log('addTodo()')
    this.BK.addTodo('item ' + new Date().toTimeString()).subscribe(
      resp => console.log(resp),
      err => console.error(err)
    );
  }
}