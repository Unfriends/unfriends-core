export type State = {
    op: 'add';
    path: Array<string | number>;
    val: any;
  } | {
    op: 'update';
    path: Array<string | number>;
    val: any;
    oldVal?: any;
  } | {
    op: 'delete';
    path: Array<string | number>;
    val: any;
    oldVal?: any;
  }