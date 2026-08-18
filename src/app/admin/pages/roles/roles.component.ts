import { Component, OnDestroy, OnInit } from '@angular/core';
import { AdminRolesService, Role } from '../../services/admin-roles.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, Subscription, debounceTime, distinctUntilChanged } from 'rxjs';
import { PermissionService } from '../../services/permission.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-roles',
  templateUrl: './roles.component.html',
  styleUrls: ['./roles.component.scss'],
})
export class RolesComponent implements OnInit, OnDestroy {
  private searchSubject = new Subject<string>();
  private searchSubscription?: Subscription;
  roles: Role[] = [];
  isLoading: boolean = false;
  error: string | null = null;
  searchTerm: string = '';
  permissionsMap: any[] = [];
  permissionsLoading = false;
  permissionsError = '';
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
    public permissionService: PermissionService,
    private toastService: ToastService,
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.fetchPermissions();

    this.searchSubscription = this.searchSubject
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
      name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(80)]],
      description: ['', Validators.maxLength(300)],
      permissions: [[]],
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
    if (!this.permissionService.has('users.update')) return;

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
    this.permissionsLoading = true;
    this.permissionsError = '';
    this.rolesService.getPermissions().subscribe({
      next: (res: any) => {
        this.permissionsMap = Object.entries(res?.data || res || {}).map(
          ([key, value]) => ({
            key,
            value,
          }),
        );
        this.permissionsLoading = false;
      },
      error: () => {
        this.permissionsLoading = false;
        this.permissionsError = 'Unable to load available permissions.';
      },
    });
  }

  openDrawer(): void {
    if (!this.permissionService.has('users.create')) return;

    this.isEditMode = false;
    this.selectedRoleId = null;
    this.createRoleForm.reset({
      name: '',
      description: '',
      permissions: [],
    });
    this.isDrawerOpen = true;
  }

  closeDrawer(): void {
    if (this.isCreating) return;

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

          const totalPages = this.totalPages;
          if (this.page > totalPages) {
            this.page = totalPages;
            this.fetchRoles();
          }
        },
        error: (err) => {
          this.error = err?.error?.message || 'Failed to fetch roles';
          this.isLoading = false;
        },
      });
  }

  onPageChange(page: number): void {
    if (page < 1 || page > this.totalPages) return;

    this.page = page;
    this.fetchRoles();
  }

  onLimitChange(limit: number): void {
    if (limit === this.limit) return;

    this.limit = limit;
    this.page = 1;
    this.fetchRoles();
  }

  onSearchInput(): void {
    this.searchSubject.next(this.searchTerm.trim());
  }

  getPermissionsList(module: any): string[] {
    return module?.value ? Object.values(module.value).filter(
      (permission): permission is string => typeof permission === 'string',
    ) : [];
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
    if (this.createRoleForm.invalid) {
      this.createRoleForm.markAllAsTouched();
      return;
    }

    const name = String(this.createRoleForm.value.name || '').trim().toLowerCase();

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
      name: String(this.createRoleForm.value.name || '').trim(),
      description: String(this.createRoleForm.value.description || '').trim(),
      permissions: cleanPermissions,
    };

    let request$;

    if (this.selectedRoleId) {
      request$ = this.rolesService.updateRole(this.selectedRoleId, payload);
    } else {
      request$ = this.rolesService.createRole(payload);
    }
    request$.subscribe({
      next: (res: any) => {
        this.isCreating = false;
        const wasEdit = this.isEditMode;
        this.closeDrawer();
        this.fetchRoles();
        this.toastService.success(
          wasEdit ? 'Role updated successfully' : 'Role created successfully',
        );
      },

      error: (err) => {
        this.isCreating = false;
        const message = err?.error?.message || 'Failed to save role';
        this.createRoleForm.get('name')?.setErrors(
          message.toLowerCase().includes('already exists') ? { duplicate: true } : null,
        );
        this.toastService.error(message);
      },
    });
  }

  confirmDelete(role: Role): void {
    if (!this.permissionService.has('users.delete')) return;
    this.roleToDelete = role;
    this.deleteModalOpen = true;
  }

  closeDeleteModal(): void {
    this.deleteModalOpen = false;
    this.roleToDelete = null;
  }

  deleteRole(): void {
    if (!this.roleToDelete || !this.permissionService.has('users.delete')) return;

    this.isDeleting = true;

    this.rolesService.deleteRole(this.roleToDelete._id).subscribe({
      next: () => {
        this.isDeleting = false;
        this.closeDeleteModal();
        if (this.page > 1 && this.roles.length === 1) {
          this.page -= 1;
        }
        this.fetchRoles();
        this.toastService.success('Role deleted successfully');
      },
      error: (err) => {
        this.isDeleting = false;
        this.toastService.error(err?.error?.message || 'Failed to delete role');
      },
    });
  }

  get totalPages(): number {
    return Math.ceil(this._backendTotal / this.limit) || 1;
  }

  get backendTotal(): number {
    return this._backendTotal;
  }

  ngOnDestroy(): void {
    this.searchSubscription?.unsubscribe();
    this.searchSubject.complete();
  }
}
