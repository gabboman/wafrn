import type { Application, Response } from "express";
import { Op } from "sequelize";
import {
	Post,
	QuestionPoll,
	QuestionPollAnswer,
	QuestionPollQuestion,
	User,
} from "../db.js";
import type AuthorizedRequest from "../interfaces/authorizedRequest.js";
import { voteInPoll } from "../utils/activitypub/votePollRemote.js";
import { authenticateToken } from "../utils/authenticateToken.js";
export default function pollRoutes(app: Application) {
	app.post(
		"/api/v2/pollVote/:poll",
		authenticateToken,
		async (req: AuthorizedRequest, res: Response) => {
			const posterId = req.jwtData?.userId ? req.jwtData?.userId : "";
			const pollId = req.params.poll;
			const votes: number[] = req.body.votes;

			// We get the selected polls, all the avaiable options, and also if the user has voted in any
			const pollOptions = await QuestionPollQuestion.findAll({
				include: [
					{
						required: false,
						model: QuestionPollAnswer,
						where: {
							userId: posterId,
						},
					},
					{
						model: QuestionPoll,
						include: [
							{
								model: QuestionPollQuestion,
								include: [
									{
										required: false,
										model: QuestionPollAnswer,
										where: {
											userId: posterId,
										},
									},
								],
							},
						],
					},
				],
				where: {
					questionPollId: pollId,
					id: {
						[Op.in]: votes,
					},
				},
			});

			if (pollOptions?.length > 0) {
				const userHasReplied =
					pollOptions[0].questionPoll.questionPollQuestions.some(
						(question: any) => question.questionPollAnswers.length > 0,
					);
				const pollOpen = pollOptions[0].questionPoll.endDate > new Date();
				if (userHasReplied) {
					res.send({ success: false, message: "User has already voted" });
					return;
				}
				if (!pollOpen) {
					res.send({
						success: false,
						message: "Poll is already closed",
					});
					return res;
				}
				// Now we create the poll and we send the thing to the user and the voters
				// first we store the vote in the db
				for await (const pollOption of pollOptions) {
					await QuestionPollAnswer.create({
						userId: posterId,
						questionPollQuestionId: pollOption.id,
					});
				}

				res.send({ success: true });
				if (
					(
						await QuestionPoll.findByPk(pollId, {
							include: [
								{
									model: Post,
									include: [
										{
											model: User,
											as: "user",
										},
									],
								},
							],
						})
					).post.user.url.startsWith("@")
				) {
					voteInPoll(posterId, Number.parseInt(pollId));
				}
			} else {
				res.send({
					success: false,
					message: "The poll and options do not exist",
				});
			}
		},
	);
}
