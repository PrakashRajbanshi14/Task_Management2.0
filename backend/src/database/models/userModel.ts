import { Table, Column, Model, DataType } from "sequelize-typescript"
import { UserAttributes } from "../types/types"
import { UserRole } from "../../globals/types"


interface UserCreationAttributes
    extends Omit<UserAttributes, "id" | "role"> {
    id?: string
    role?: UserRole
}


@Table({
    tableName: "users",
    modelName: "User",
    timestamps: true
})


class User extends Model<UserAttributes, UserCreationAttributes> {

    @Column({
        primaryKey: true,
        type: DataType.UUID,
        defaultValue: DataType.UUIDV4
    })
    declare id: string


    @Column({
        type: DataType.STRING
    })
    declare userName: string


    @Column({
        type: DataType.STRING
    })
    declare email: string

    @Column({
        type: DataType.STRING,
        allowNull: true
    })
    declare password: string | null


    @Column({
        type: DataType.STRING,
        allowNull: true,
        unique: true
    })
    declare googleId: string | null


    @Column({
        type: DataType.STRING
    })
    declare fullName: string


    @Column({
        type: DataType.STRING,
        allowNull: true
    })
    declare profileImage: string | null


    @Column({
        type: DataType.STRING,
        defaultValue: UserRole.User,
        validate: {
            isIn: [Object.values(UserRole)]
        }
    })
    declare role: UserRole


    @Column({
        type: DataType.BOOLEAN,
        defaultValue: true
    })
    declare isActive: boolean
}


export default User