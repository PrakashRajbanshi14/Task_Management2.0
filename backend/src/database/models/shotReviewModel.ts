import {
    Table,
    Column,
    Model,
    DataType
} from "sequelize-typescript"
import { ShotReviewAttributes } from "../types/types"
import { ReviewStatus } from "../../globals/types"

interface ShotReviewCreationAttributes
    extends Omit<ShotReviewAttributes, "id"> {

    id?: string
}


@Table({
    tableName: "shot_reviews",
    modelName: "ShotReview",
    timestamps: true
})


class ShotReview
    extends Model<
        ShotReviewAttributes,
        ShotReviewCreationAttributes
    > {


    @Column({
        primaryKey: true,
        type: DataType.UUID,
        defaultValue: DataType.UUIDV4
    })
    declare id: string

    @Column({
        type: DataType.UUID
    })
    declare shotID: string

    @Column({
        type: DataType.UUID
    })
    declare submissionId: string


    @Column({
        type: DataType.UUID
    })
    declare reviewedBy: string


    @Column({
        type: DataType.STRING,
        validate: {
            isIn: [Object.values(ReviewStatus)]
        }
    })
    declare status: ReviewStatus


    @Column({
        type: DataType.TEXT,
        allowNull: true
    })
    declare comment: string | null
}


export default ShotReview