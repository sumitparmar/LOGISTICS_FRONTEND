import { Component, OnInit } from '@angular/core';
import { AdminRolesService, Role } from '../../services/admin-roles.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';

@Component({
  selector: 'app-roles',
  templateUrl: './roles.component.html',
  styleUrls: ['./roles.component.scss'],
})
export class RolesComponent implements OnInit {
  private searchSubject = new Subject<string>();
  errorMessage: string = '';
  roles: Role[] = [];
  isLoading: boolean = false;
  error: string | null = null;
  searchTerm: string = '';
  permissionsMap: any = {};
  createRoleForm!: FormGroup;
  isDrawerOpen: boolean = false;
  isCreating: boolean = false;
  deleteModalOpen: boolean = false;
  roleToDelete: Role | null = null;
  isDeleting: boolean = false;
  isEditMode: boolean = false;
  selectedRoleId: string | null = null;

  page: number = 1;
  limit: number = 10;
  private _backendTotal: number = 0;

  constructor(
    private rolesService: AdminRolesService,
    private fb: FormBuilder,
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.fetchPermissions();

    this.searchSubject
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe((value) => {
        this.page = 1;
        this.searchTerm = value;
        this.fetchRoles();
      });

    this.fetchRoles();
  }

  initForm(): void {
    this.createRoleForm = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      permissions: [],
    });

    this.createRoleForm.get('name')?.valueChanges.subscribe(() => {
      if (this.createRoleForm.get('name')?.hasError('duplicate')) {
        this.createRoleForm.get('name')?.updateValueAndValidity();
      }
    });
  }

  trackByRole(index: number, role: Role): string {
    return role._id;
  }

  editRole(role: Role): void {
    this.isEditMode = true;
    this.selectedRoleId = role._id;
    this.isDrawerOpen = true;

    this.createRoleForm.patchValue({
      name: role.name,
      description: role.description,
      permissions: role.permissions || [],
    });
  }

  fetchPermissions(): void {
    this.rolesService.getPermissions().subscribe({
      next: (res: any) => {
        this.permissionsMap = Object.entries(res.data || res || {}).map(
          ([key, value]) => ({
            key,
            value,
          }),
        );
      },
      error: (err) => {
        console.error('PERMISSIONS ERROR:', err);
      },
    });
  }

  openDrawer(): void {
    this.isDrawerOpen = true;
  }

  closeDrawer(): void {
    this.isDrawerOpen = false;
    this.isEditMode = false;
    this.selectedRoleId = null;

    this.createRoleForm.reset({
      name: '',
      description: '',
      permissions: [],
    });
  }

  fetchRoles(): void {
    this.isLoading = true;
    this.error = null;

    this.rolesService
      .getRoles(this.page, this.limit, this.searchTerm)
      .subscribe({
        next: (res: any) => {
          this.roles = res?.data || [];
          this._backendTotal = res?.pagination?.total || 0;
          this.isLoading = false;
        },
        error: (err) => {
          this.error = err?.error?.message || 'Failed to fetch roles';
          this.isLoading = false;
        },
      });
  }

  onPageChange(page: number): void {
    this.page = page;
    this.fetchRoles();
  }

  onSearchInput(): void {
    this.searchSubject.next(this.searchTerm.trim());
  }

  getPermissionsList(module: any): string[] {
    return module?.value ? Object.values(module.value) : [];
  }

  isAllSelected(module: any): boolean {
    const modulePerms: string[] = module.value
      ? Object.values(module.value)
      : [];
    const selected: string[] = this.createRoleForm.value.permissions || [];

    return modulePerms.every((p) => selected.includes(p));
  }

  toggleModule(module: any, event: any): void {
    const modulePerms: string[] = module.value
      ? Object.values(module.value)
      : [];
    let selected: string[] = this.createRoleForm.value.permissions || [];

    if (event.target.checked) {
      // add all (avoid duplicates)
      selected = [...new Set([...selected, ...modulePerms])];
    } else {
      // remove all
      selected = selected.filter((p) => !modulePerms.includes(p));
    }

    this.createRoleForm.patchValue({ permissions: selected });
  }

  onPermissionChange(event: any): void {
    let selected: string[] = this.createRoleForm.value.permissions || [];

    if (event.target.checked) {
      selected = [...new Set([...selected, event.target.value])];
    } else {
      selected = selected.filter((p: string) => p !== event.target.value);
    }

    this.createRoleForm.patchValue({ permissions: selected });
  }

  createRole(): void {
    if (this.isCreating) return;
    if (this.createRoleForm.invalid) return;

    const name = this.createRoleForm.value.name?.trim().toLowerCase();

    const exists = this.roles.some(
      (r) =>
        r.name.trim().toLowerCase() === name && r._id !== this.selectedRoleId,
    );

    if (exists) {
      this.createRoleForm.get('name')?.setErrors({ duplicate: true });
      return;
    }

    this.isCreating = true;

    const cleanPermissions = (
      this.createRoleForm.value.permissions || []
    ).filter((p: any) => typeof p === 'string' && p.trim());

    const payload = {
      ...this.createRoleForm.value,
      permissions: cleanPermissions,
    };
    console.log('CLICKED UPDATE / CREATE');
    console.log('isEditMode:', this.isEditMode);
    console.log('selectedRoleId:', this.selectedRoleId);
    console.log('payload:', payload);
    let request$;

    if (this.selectedRoleId) {
      request$ = this.rolesService.updateRole(this.selectedRoleId, payload);
    } else {
      request$ = this.rolesService.createRole(payload);
    }
    request$.subscribe({
      next: (res: any) => {
        this.isCreating = false;

        const newRole = res?.data;

        const isEdit = this.isEditMode;
        const roleId = this.selectedRoleId;

        if (isEdit && roleId) {
          this.roles = this.roles.map((r) => (r._id === roleId ? newRole : r));
        } else {
          this.roles = [newRole, ...this.roles];
        }

        this.closeDrawer(); // move AFTER update
      },

      error: (err) => {
        this.isCreating = false;
        this.errorMessage = err?.error?.message || 'Failed to save role';
        console.error('ROLE SAVE ERROR:', err);
      },
    });
  }

  confirmDelete(role: Role): void {
    this.roleToDelete = role;
    this.deleteModalOpen = true;
  }

  closeDeleteModal(): void {
    this.deleteModalOpen = false;
    this.roleToDelete = null;
  }

  deleteRole(): void {
    if (!this.roleToDelete) return;

    this.isDeleting = true;

    this.rolesService.deleteRole(this.roleToDelete._id).subscribe({
      next: () => {
        this.isDeleting = false;

        const deletedId = this.roleToDelete?._id;

        this.roles = this.roles.filter((r) => r._id !== deletedId);

        this.closeDeleteModal();
      },
      error: (err) => {
        this.isDeleting = false;
        this.errorMessage = err?.error?.message || 'Failed to delete role';
      },
    });
  }

  get totalPages(): number {
    return Math.ceil(this._backendTotal / this.limit) || 1;
  }
}
