export class Workspace {
  id!: string;
  name!: string;
  ownerId!: string;
  requiredDepartment?: string; // 이 소속을 가진 사람만 생성/참여 가능
}
