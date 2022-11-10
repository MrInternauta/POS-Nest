import { SetMetadata } from '@nestjs/common';

import { IS_PUBLIC_KEY } from '../../common/constants/constants';

export const Is_PublicD = () => SetMetadata(IS_PUBLIC_KEY, true);
