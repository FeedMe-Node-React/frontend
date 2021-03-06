import React, { Component, Fragment } from 'react';
import openSocket from 'socket.io-client';

import Post from '../../components/Feed/Post/Post';
import Button from '../../components/Button/Button';
import FeedEdit from '../../components/Feed/FeedEdit/FeedEdit';
import Input from '../../components/Form/Input/Input';
// import Paginator from '../../components/Paginator/Paginator';
import Loader from '../../components/Loader/Loader';
import ErrorHandler from '../../components/ErrorHandler/ErrorHandler';
import './Feed.css';

class Feed extends Component {
  state = {
    isEditing: false,
    posts: [],
    totalPosts: 0,
    editPost: null,
    status: '',
    postPage: 1,
    postsLoading: true,
    editLoading: false
  };

  componentDidMount() {
    const userId = this.props.userId;
    fetch('https://feed-me-node-api.herokuapp.com/user/' + userId, {
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
      body: JSON.stringify({
        userId: userId
      })
    })
      .then(res => {
        if (res.status !== 200) {
          throw new Error('Failed to fetch user status.');
        }
        return res.json();
      })
      .then(resData => {
        this.setState({ status: resData.status });
      })
      .catch(this.catchError);
    
    const socket = openSocket('https://feed-me-node-api.herokuapp.com/');

    socket.on('posts', data => {
      console.log(data);
      
      if (data.action === 'create' && data.post.user._id !== userId) {
        this.addPost(data.post);
      } else if (data.action === 'delete') {
        this.deletePost(data.post);
      }
    });
    
    this.loadPosts();
  };

  addPost = post => {
    this.setState(prevState => {
      const updatedPosts = [...prevState.posts];
      // if (prevState.postPage === 1) {
      //   if (prevState.posts.length >= 2) {
      //     updatedPosts.pop();
      //   }
      updatedPosts.unshift(post);
      // }
      console.log(post)
      return {
        posts: updatedPosts,
        totalPosts: prevState.totalPosts + 1
      };
    });
  };
  
  deletePost = post => {
    this.setState(prevState => {
      const updatedPosts = prevState.posts.filter(p => p._id !== post._id);
      return {
        posts: updatedPosts,
        totalPosts: prevState.totalPosts - 1,
        postsLoading: false
      };
    });
  };

  loadPosts = direction => {
    if (direction) {
      this.setState({ postsLoading: true, posts: [] });
    }
    let page = this.state.postPage;
    if (direction === 'next') {
      page++;
      this.setState({ postPage: page });
    }
    if (direction === 'previous') {
      page--;
      this.setState({ postPage: page });
    }
    fetch('https://feed-me-node-api.herokuapp.com/feed/posts/', {
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + this.props.token
      }
    })
      .then(res => {
        if (res.status !== 200) {
          throw new Error('Failed to fetch posts.');
        }
        return res.json();
      })
      .then(resData => {
        this.setState({
          posts: resData,
          totalPosts: resData.totalItems,
          postsLoading: false
        });
      })
      .catch(this.catchError);
  };

  statusUpdateHandler = event => {
    const userId = this.props.userId;
    event.preventDefault();
    fetch('https://feed-me-node-api.herokuapp.com/user/' + userId, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + this.props.token,
      },
      method: 'PATCH',
      body: JSON.stringify({
        userId: userId,
        status: this.state.status
      })
    })
      .then(res => {
        if (res.status !== 200 && res.status !== 201) {
          throw new Error("Can't update status!");
        }
        return res.json();
      })
      .then(resData => {
        console.log(resData);
      })
      .catch(this.catchError);
  };

  newPostHandler = () => {
    this.setState({ isEditing: true });
  };

  startEditPostHandler = postId => {
    this.setState(prevState => {
      const loadedPost = { ...prevState.posts.find(p => p._id === postId) };
      return {
        isEditing: true,
        editPost: loadedPost
      };
    });
  };

  cancelEditHandler = () => {
    this.setState({ isEditing: false, editPost: null });
  };

  finishEditHandler = postData => {
    this.setState({
      editLoading: true
    });
    const formData = new FormData();
    formData.append('title', postData.title)
    formData.append('content', postData.content)
    formData.append('image', postData.image)
    formData.append('userId', this.props.userId)

    let url = 'https://feed-me-node-api.herokuapp.com/feed/post/';
    let method = 'POST'
    if (this.state.editPost) {
      url = url + this.state.editPost._id;
      method = 'PATCH'
    }

    fetch(url, {
      method: method,
      headers: {
        Authorization: 'Bearer ' + this.props.token,
      },
      body: formData
    })
      .then(res => {
        if (res.status !== 200 && res.status !== 201) {
          throw new Error('Creating or editing a post failed!');
        }
        return res.json();
      })
      .then(resData => {
        const post = {
          _id: resData._id,
          title: resData.title,
          content: resData.content,
          image: resData.image,
          user: resData.user,
          createdAt: resData.createdAt
        };
        this.setState(prevState => {
          let updatedPosts = [...prevState.posts];
          if (prevState.editPost) {
            const postIndex = prevState.posts.findIndex(
              p => p._id === prevState.editPost._id
            );
            updatedPosts[postIndex] = post;
            // } else if (prevState.posts.length < 2) // {
          } else {
            updatedPosts.unshift(post);
          }
          return {
            posts: updatedPosts,
            isEditing: false,
            editPost: null,
            editLoading: false
          };
        });
      })
      .catch(err => {
        console.log(err);
        this.setState({
          isEditing: false,
          editPost: null,
          editLoading: false,
          error: err
        });
      });
  };

  statusInputChangeHandler = (input, value) => {
    this.setState({ status: value });
  };

  deletePostHandler = postId => {
    this.setState({ postsLoading: true });
    fetch('https://feed-me-node-api.herokuapp.com/feed/post/' + postId, {
      method: 'DELETE',
      headers: {
        Authorization: 'Bearer ' + this.props.token,
      },
    })
      .then(res => {
        if (res.status !== 200 && res.status !== 201) {
          throw new Error('Deleting a post failed!');
        }
        return res.json();
      })
      .catch(err => {
        console.log(err);
        this.setState({ postsLoading: false });
      });
  };

  errorHandler = () => {
    this.setState({ error: null });
  };

  catchError = error => {
    this.setState({ error: error });
  };

  render() {
    return (
      <Fragment>
        <ErrorHandler error={this.state.error} onHandle={this.errorHandler} />
        <FeedEdit
          editing={this.state.isEditing}
          selectedPost={this.state.editPost}
          loading={this.state.editLoading}
          onCancelEdit={this.cancelEditHandler}
          onFinishEdit={this.finishEditHandler}
        />
        <section className="feed__status">
          <form onSubmit={this.statusUpdateHandler}>
            <Input
              type="text"
              placeholder="Your status"
              control="input"
              onChange={this.statusInputChangeHandler}
              value={this.state.status}
            />
            <Button mode="flat" type="submit">
              Update
            </Button>
          </form>
        </section>
        <section className="feed__control">
          <Button mode="raised" design="accent" onClick={this.newPostHandler}>
            New Post
          </Button>
        </section>
        <section className="feed">
          {this.state.postsLoading && (
            <div style={{ textAlign: 'center', marginTop: '2rem' }}>
              <Loader />
            </div>
          )}
          {this.state.posts.length <= 0 && !this.state.postsLoading ? (
            <p style={{ textAlign: 'center' }}>No posts found.</p>
          ) : null}
          {!this.state.postsLoading && (
            // <Paginator
            //   onPrevious={this.loadPosts.bind(this, 'previous')}
            //   onNext={this.loadPosts.bind(this, 'next')}
            //   lastPage={Math.ceil(this.state.totalPosts / 2)}
            //   currentPage={this.state.postPage}
            // >
            this.state.posts.map(post => (
              <Post
                key={post._id}
                id={post._id}
                user={post.user}
                date={new Date(post.createdAt).toLocaleDateString('en-US')}
                title={post.title}
                image={post.image}
                content={post.content}
                onStartEdit={this.startEditPostHandler.bind(this, post._id)}
                onDelete={this.deletePostHandler.bind(this, post._id)}
              />
            ))
            // </Paginator>
          )}
        </section>
      </Fragment>
    );
  }
}

export default Feed;
