import { SetMetadata } from '@nestjs/common';

import { ROLES_KEY } from '../../../core/constants/constants';
import { Role } from '../models/roles.model';

export const RoleD = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
