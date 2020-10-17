import React, { Component } from 'react';
import 'dotenv';

import Image from '../../../components/Image/Image';
import './SinglePost.css';

class SinglePost extends Component {
  state = {
    title: '',
    user: '',
    date: '',
    image: '',
    content: ''
  };

  componentDidMount() {
    const postId = this.props.match.params.postId;
    // fetch('http://localhost:8080/feed/post/' + postId, {
    fetch('https://feed-me-node-api.herokuapp.com/feed/post/' + postId, {
      headers: {
        Authorization: 'Bearer ' + this.props.token
      }
    })
      .then(res => {
        if (res.status !== 200) {
          throw new Error('Failed to fetch status');
        }
        return res.json();
      })
      .then(resData => {
        console.log(resData)
        this.setState({
          title: resData.title,
          user: resData.user.name,
          // image: 'http://localhost:8080/' + resData.image,
          image: 'https://feed-me-node-api.herokuapp.com/' + resData.image,
          date: new Date(resData.createdAt).toLocaleDateString('en-US'),
          content: resData.content
        });
      })
      .catch(err => {
        console.log(err);
      });
  }

  render() {
    return (
      <section className="single-post">
        <h1>{this.state.title}</h1>
        <h2>
          Created by {this.state.user} on {this.state.date}
        </h2>
        <div className="single-post__image">
          <Image contain image={this.state.image} />
        </div>
        <p>{this.state.content}</p>
      </section>
    );
  }
}

export default SinglePost;
