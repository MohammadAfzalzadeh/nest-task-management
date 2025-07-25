import { ApiProperty } from '@nestjs/swagger';


export class ProfileImageDto{
  @ApiProperty({ description: 'image for this profile' , type: 'string' , format: 'binary' , required: true })
  profileImage:any;
}

