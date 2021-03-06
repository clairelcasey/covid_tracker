import os

from flask import Flask, render_template, request, flash, redirect, session, g, url_for
from flask_debugtoolbar import DebugToolbarExtension
from sqlalchemy.exc import IntegrityError

from forms import UserAddForm, LoginForm, UserLogoutForm, LocationAddForm
from models import db, connect_db, User, Location

CURR_USER_KEY = "curr_user"

app = Flask(__name__)

# Get DB_URI from environ variable (useful for production/testing) or,
# if not set there, use development local db.
app.config['SQLALCHEMY_DATABASE_URI'] = (
    os.environ.get('DATABASE_URL', 'postgres:///covid_tracker'))

app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SQLALCHEMY_ECHO'] = False
app.config['DEBUG_TB_INTERCEPT_REDIRECTS'] = False
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', "it's a secret")
toolbar = DebugToolbarExtension(app)

connect_db(app)



##############################################################################
# User signup/login/logout


@app.before_request
def add_user_to_g():
    """If we're logged in, add curr user to Flask global."""
    print('ADD USER RAN')
    if CURR_USER_KEY in session:

        g.user = User.query.get(session[CURR_USER_KEY])
        g.UserLogoutForm = UserLogoutForm()
        print(g.user)

    else:
        g.user = None
        print('NO USER')


def do_login(user):
    """Log in user."""

    session[CURR_USER_KEY] = user.id


def do_logout():
    """Logout user."""

    if CURR_USER_KEY in session:
        del session[CURR_USER_KEY]


@app.route('/signup', methods=["GET", "POST"])
def signup():
    """Handle user signup.

    Create new user and add to DB. Redirect to home page.

    If form not valid, present form.

    If the there already is a user with that username: flash message
    and re-present form.
    """

    form = UserAddForm()
    if form.validate_on_submit():
        try:
            user = User.signup(
                username=form.username.data,
                password=form.password.data,
                email=form.email.data,
            )
            db.session.commit()

        except IntegrityError:
            flash("Username already taken", 'danger')
            return render_template('users/signup.html', form=form)

        do_login(user)

        return redirect("/")

    else:
        return render_template('users/signup.html', form=form)


@app.route('/login', methods=["GET", "POST"])
def login():
    """Handle user login."""

    form = LoginForm()

    if form.validate_on_submit():
        user = User.authenticate(form.username.data,
                                 form.password.data)

        if user:
            do_login(user)
            flash(f"Hello, {user.username}!", "success")
            return redirect("/")

        flash("Invalid credentials.", 'danger')

    return render_template('users/login.html', form=form)


@app.route('/logout', methods=["POST"])
def logout():
    """Handle logout of user."""

    if g.UserLogoutForm.validate_on_submit():
        do_logout()
        flash("Successfully logged out!")

    return redirect('/login')


##############################################################################
# General user routes:

@app.route('/')
def homepage():
    """ Render homepage. """

    if not g.user:
        return render_template('home-anon.html')

    

    return render_template('home.html')


##############################################################################
# General location routes:

@app.route('/locations/add', methods=["GET", "POST"])
def location_add():
    """ Add a location. """

    if not g.user:
        flash("Access unauthorized.", "danger")
        return redirect("/")

    form = LocationAddForm()

    counties_choices = [ (c.id, c.name) for c in Location.query.all()]
    form.name.choices = counties_choices

    if form.validate_on_submit():
        loc = Location.query.get(form.name.data)
        print(loc, 'location is')
        g.user.locations.append(loc)
        db.session.commit()
        return redirect("/")

    return render_template('locations/add.html', form=form)

@app.route('/locations/stop-following/<int:location_id>', methods=["POST"])
def stop_following(location_id):
    """ Remove a location """

    if not g.user:
        flash("Access unauthorized.", "danger")
        return redirect("/")

    followed_location = Location.query.get(location_id)
    g.user.locations.remove(followed_location)
    db.session.commit()

    return redirect("/")
