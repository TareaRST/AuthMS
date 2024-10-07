import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Payload, RpcException } from '@nestjs/microservices';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { LoginUserDto, RegisterUserDto } from './dto';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from './interfaces';
import { envs } from 'src/config';

@Injectable()
export class AuthService extends PrismaClient implements OnModuleInit{

    private readonly logger = new Logger('Auth Service');

    constructor(private readonly jwtService: JwtService) {super()}

    onModuleInit() {
        this.$connect();
        this.logger.log('PostgresDB connected');
    }

    async signJWT(payload : JwtPayload) {
        return this.jwtService.sign(payload);
    }

    async verifyToken(token : string) {
        try {
            
            const {sub, iat, exp, ...user} = this.jwtService.verify(token, {
                secret: envs.secret,
            });

            return {
                user: user,
                token: await this.signJWT(user),
            }


        } catch (error) {
            console.log(error);
            throw new RpcException({
                status: 401,
                message: "Invalid Token"
            })
        }
        
    }

    async registerUser(registerUserDto: RegisterUserDto) {

        const {email, name, password} = registerUserDto;

        try {
            
            const user = await this.user.findUnique({
                where: {
                    email
                }
            })

            if(user) {
                throw new RpcException({
                    status: 400,
                    message: 'User already exists',
                })
            }

            const newUser = await this.user.create({
                data: {
                    email: email,
                    name: name,
                    password: bcrypt.hashSync(password,10),
                }
            })

            const { password: __, ...rest} = newUser;

            return {
                user: rest,
                token: await this.signJWT( rest ),
            }

        } catch (error) {
            throw new RpcException({
                status: 400,
                message: error.message,
            })
        }
    }

    async loginUser(loginUserDto: LoginUserDto) {

        const {email, password} = loginUserDto;
        console.log(email)
        try {
            
            const user = await this.user.findUnique({
                where: { email: email}
            })
            
            if(!user) {
                throw new RpcException({
                    status: 400,
                    message: 'User/Password not valid - email',
                })
            }

            const isPasswordValid = bcrypt.compareSync(password, user.password);

            if(!isPasswordValid) {
                throw new RpcException({
                    status: 400,
                    message: 'User/Password not valid - password',
                })
            }

            const { password: __, ...rest} = user;

            return {
                user: rest,
                token: await this.signJWT( rest ),
            }

        } catch (error) {
            throw new RpcException({
                status: 400,
                message: error.message,
            })
        }
    }


}
