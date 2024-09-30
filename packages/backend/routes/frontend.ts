import fs from "node:fs";
import express, { type Application, type Response } from "express";
import { Op } from "sequelize";
import { Media, Post, User } from "../db.js";
import { environment } from "../environment.js";
import type { SignedRequest } from "../interfaces/fediverse/signedRequest.js";
import { getCheckFediverseSignatureFucnction } from "../utils/activitypub/checkFediverseSignature.js";
import { handlePostRequest } from "../utils/activitypub/handlePostRequest.js";
import { redisCache } from "../utils/redis.js";
import dompurify from 'isomorphic-dompurify'

const cacheOptions = {
	etag: false,
	maxAge: "1",
};

function frontend(app: Application) {
	const defaultSeoData = environment.defaultSEOData;

	// serve default angular application
	app.get(
		[
			"/",
			"/index.html",
			"/index",
			"/dashboard/*",
			"/dashboard",
			"/login",
			"/register",
			"/privacy",
			"/admin/*",
			"/profile/*",
		],
		(_req, res) => {
			res.send(
				getIndexSeo(
					defaultSeoData.title,
					defaultSeoData.description,
					defaultSeoData.img,
				),
			);
		},
	);

	app.get(
		"/post/:id",
		getCheckFediverseSignatureFucnction(false),
		async (req: SignedRequest, res) => {
			//res.redirect(`/fediverse${req.url}`)
			res.send(
				`<script>
        location.replace('/fediverse${req.url}')
      </script>
      <a href="${environment.frontendUrl}/fediverse${req.url}">Hello. Post has been moved here. Please click to go</a>`,
			);
		},
	);

	app.get("/blog/:url/:somethingElse", async (_req, res) => {
		res.send(
			getIndexSeo(
				defaultSeoData.title,
				defaultSeoData.description,
				defaultSeoData.img,
			),
		);
	});

	app.get("/blog/:url", async (req, res) => {
		if (req.params?.url) {
			try {
				const blogData = await getBlogSEOCache(req.params.url);
				if (blogData) {
					res.send(
						getIndexSeo(blogData.title, blogData.description, blogData.img),
					);
				} else {
					res.send(
						getIndexSeo(
							defaultSeoData.title,
							defaultSeoData.description,
							defaultSeoData.img,
						),
					);
				}
			} catch (_error) {
				res.send(
					getIndexSeo(
						defaultSeoData.title,
						defaultSeoData.description,
						defaultSeoData.img,
					),
				);
			}
		} else {
			res.send(
				getIndexSeo(
					defaultSeoData.title,
					defaultSeoData.description,
					defaultSeoData.img,
				),
			);
		}
	});

	// serve static angular files
	app.get("*.*", express.static(environment.frontedLocation, cacheOptions));

	app.get(
		["/fediverse/post/:id", "/fediverse/activity/post/:id"],
		getCheckFediverseSignatureFucnction(false),
		async (req: SignedRequest, res: Response) => {
			if (req.fediData?.valid) {
				await handlePostRequest(req, res);
			} else {
				const defaultSeoData = environment.defaultSEOData;
				if (req.params?.id) {
					try {
						const postData = await getPostSEOCache(req.params.id);
						if (postData) {
							res.send(
								getIndexSeo(postData.title, postData.description, postData.img),
							);
						} else {
							res.send(
								getIndexSeo(
									defaultSeoData.title,
									defaultSeoData.description,
									defaultSeoData.img,
								),
							);
						}
					} catch (_error) {
						res.send(
							getIndexSeo(
								defaultSeoData.title,
								defaultSeoData.description,
								defaultSeoData.img,
							),
						);
					}
				} else {
					res.send(
						getIndexSeo(
							defaultSeoData.title,
							defaultSeoData.description,
							defaultSeoData.img,
						),
					);
				}
			}
		},
	);
}

function sanitizeStringForSeo(unsanitized: string): string {
	return dompurify.sanitize(unsanitized, { ALLOWED_TAGS: [] })
		.replaceAll('"', "'");
}

async function getPostSEOCache(
	id: string,
): Promise<{ title: string; description: string; img: string }> {
	const resData = await redisCache.get(`postSeoCache:${id}`);
	let res = { ...environment.defaultSEOData };
	if (resData) {
		res = JSON.parse(resData);
	} else {
		const post = await Post.findOne({
			attributes: ["content", "id", "privacy", "content_warning"],
			where: {
				id: id,
				privacy: {
					[Op.in]: [0, 2, 3],
				},
			},
			include: [
				{
					model: User,
					as: "user",
					attributes: ["url", "avatar"],
					where: {
						url: {
							[Op.notLike]: "@%",
						},
					},
				},
				{
					model: Media,
					attributes: ["NSFW", "url", "external"],
				},
			],
		});
		if (post) {
			res.title =
				`${post.user.url.startsWith("@") ? "External" : "Wafrn"} post by ${sanitizeStringForSeo(
					post.user.url,
				)}`.substring(0, 65);
			res.description = (
				post.content_warning
					? `Post has content warning: ${sanitizeStringForSeo(post.content_warning)}`
					: sanitizeStringForSeo(post.content)
			).substring(0, 190);
			const safeMedia = post.medias?.find(
				(elem: any) =>
					elem.NSFW === false && !elem.url.toLowerCase().endsWith("mp4"),
			);
			res.img = safeMedia?.url;
			redisCache.set(`postSeoCache:${id}`, JSON.stringify(res), "EX", 300);
		}
	}
	return res;
}

async function getBlogSEOCache(
	url: string,
): Promise<{ title: string; description: string; img: string }> {
	const resData = await redisCache.get(`blogSeoCache:${url}`);
	let res = { ...environment.defaultSEOData };
	if (resData) {
		res = JSON.parse(resData);
	} else {
		const blog = await User.findOne({
			where: {
				urlToLower: url.toLowerCase(),
			},
		});
		if (blog) {
			const url = sanitizeStringForSeo(blog.url).substring(0, 65);
			const name = sanitizeStringForSeo(blog.name).substring(0, 65);
			const description = sanitizeStringForSeo(blog.description).substring(
				0,
				200,
			);
			res.title = blog.url.startsWith("@")
				? `Blog from external user ${url}`
				: `@${name}'s wafrn blog`;
			res.description = description;
			res.img = blog.url.startsWith("@")
				? blog.avatar
				: `${environment.mediaUrl}${blog.avatar}`;
			await redisCache.set(
				`blogSeoCache:${url}`,
				JSON.stringify(res),
				"EX",
				300,
			);
		} else {
			// Given the fact that query can be slow even if the blog does not exist, we should cache the 404
			await redisCache.set(
				`blogSeoCache:${url}`,
				JSON.stringify(res),
				"EX",
				600,
			);
		}
	}
	return res;
}

function getIndexSeo(title: string, description: string, image?: string) {
	const sanitizedTitle = title.replaceAll('"', "'");
	const sanitizedDescription = description
		.replaceAll('"', "'")
		.substring(0, 500);
	let imgUrl = "";
	if (image) {
		imgUrl = image.toLowerCase().startsWith("https")
			? environment.externalCacheurl + encodeURIComponent(image)
			: environment.mediaUrl + image;
	}
	imgUrl = sanitizeStringForSeo(imgUrl);
	let indexWithSeo = fs
		.readFileSync(`${environment.frontedLocation}/index.html`)
		.toString();
	// index html must have a section with this html comment that we will edit out to put the seo there
	const commentToReplace =
		/<!-- BEGIN REMOVE THIS IN EXPRESS FOR SEO -->.*(.*(\n))*.*<!-- END REMOVE THIS IN EXPRESS FOR SEO -->/gm;
	indexWithSeo = indexWithSeo.replace(
		commentToReplace,
		`
    <meta property="og:title" content="${sanitizedTitle}">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${sanitizedTitle}">
    <meta property="description" content="${sanitizedDescription}">
    <meta property="og:description" content="${sanitizedDescription}">
    <meta name="twitter:description" content="${sanitizedDescription}">
    ${
			imgUrl
				? `<meta property="og:image" content="${imgUrl}">
    <meta name="twitter:image" content="${imgUrl}">`
				: ""
		}
    <meta property="og:site_name" content="${environment.instanceUrl}">
    <meta name="twitter:site" content="${environment.instanceUrl}">
    `,
	);

	return indexWithSeo;
}

export { frontend, getIndexSeo, getPostSEOCache, getBlogSEOCache };
