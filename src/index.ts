import express from "express"
import mongoose from "mongoose"

const PORT = process.env.PORT || 3000;


mongoose.connect("mongodb://localhost:27017/devshaheen-test")


interface BlogRequest {
    title: string,
    contents: string,
    isDraft: boolean,
    tags: [string]
}

const blogSchema = new mongoose.Schema({
    title: String,
    contents: String,
    createdOn: Date,
    modifiedOn: Date,
    isDraft: Boolean,
    tags: [String]
    
});

const Blog = mongoose.model('Blog', blogSchema);


const app = express();
app.use(express.json())

app.use((req, res, next) => {
    res.setHeader('Content-Type', 'application/json');
    next();
})


app.use((req, res, next) => {
    if(req.method != "POST"){
        next();
        return;
    }
    
    const apiKey = req.header('ApiKey');
    if(apiKey && apiKey == process.env.BlogApiKey){
        next();
    }
    else {
        res.status(401).end(`Unauthorized. Check API key.`);
    }
});

app.get("/healthcheck", (rq, res) => {
    res.status(200).end("Healthy");
})

app.post('/blogs', (rq, res) => {

    const blogRq: BlogRequest = rq.body;
    const newBlog = new Blog({
        title: blogRq.title,
        contents: blogRq.contents,
        createdOn: new Date(),
        modifiedOn: null,
        isDraft: blogRq.isDraft,
        tags: blogRq.tags
    })
    newBlog.save().then((r) => {
        res.end(`Created blog with id ${r.id}`);
    })
});

app.get('/blogs', (req, res) => {
    const page = parseInt(req.query.page as string);
    const limit = parseInt(req.query.limit as string);
    Blog.find({}, null, {
        skip: page * limit,
        limit: limit
    }).sort({createdOn: -1}).exec((blogs: any) => {
        res.status(200).end(JSON.stringify(blogs)) ;
    })
});

app.get('/blogs/:blogid', (req, res) => {
    console.log(req.params.blogid)
    Blog.find({_id: req.params.blogid}, (err, blog) => {
        if(err){
            res.status(404).end(JSON.stringify({
                error: `Blog not found with id ${req.params.blogid}`
            })) ;
        }
        res.status(200).end(JSON.stringify(blog[0])) ;
    })
});

app.listen(PORT, () => {
    console.log(`Listening on Port ${PORT}!`)
})
