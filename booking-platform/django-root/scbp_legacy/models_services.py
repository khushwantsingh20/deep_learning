# This is an auto-generated Django model module.
# You'll have to do the following manually to clean this up:
#   * Rearrange models' order
#   * Make sure each model has one field with primary_key=True
#   * Make sure each ForeignKey has `on_delete` set to the desired behavior.
#   * Remove `managed = False` lines if you wish to allow Django to create, modify, and delete the table
# Feel free to rename the models, but don't rename db_table values or field names.
from django.db import models


class AddressBookContacts(models.Model):
    id = models.CharField(
        db_column="Id", primary_key=True, max_length=36
    )  # Field name made lowercase.
    title = models.CharField(
        db_column="Title", max_length=10
    )  # Field name made lowercase.
    firstname = models.CharField(
        db_column="FirstName", max_length=70
    )  # Field name made lowercase.
    lastname = models.CharField(
        db_column="LastName", max_length=70
    )  # Field name made lowercase.
    roleposition = models.CharField(
        db_column="RolePosition", max_length=128, blank=True, null=True
    )  # Field name made lowercase.
    description = models.CharField(
        db_column="Description", max_length=255
    )  # Field name made lowercase.
    mobile = models.CharField(
        db_column="Mobile", max_length=50
    )  # Field name made lowercase.
    address = models.CharField(
        db_column="Address", max_length=255
    )  # Field name made lowercase.
    suburb = models.CharField(
        db_column="Suburb", max_length=50
    )  # Field name made lowercase.
    postcode = models.CharField(
        db_column="PostCode", max_length=10
    )  # Field name made lowercase.
    clientrefid = models.ForeignKey(
        "ClientRefs",
        models.DO_NOTHING,
        db_column="ClientRefId",
        related_name="address_book_contacts",
    )  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = "AddressBookContacts"


class ApplicationClients(models.Model):
    id = models.CharField(
        db_column="Id", primary_key=True, max_length=36
    )  # Field name made lowercase.
    clientkey = models.CharField(
        db_column="ClientKey", unique=True, max_length=255, blank=True, null=True
    )  # Field name made lowercase.
    secret = models.CharField(
        db_column="Secret", max_length=255
    )  # Field name made lowercase.
    name = models.CharField(
        db_column="Name", max_length=100
    )  # Field name made lowercase.
    applicationtype = models.CharField(
        db_column="ApplicationType", max_length=255
    )  # Field name made lowercase.
    active = models.BooleanField(db_column="Active")  # Field name made lowercase.
    refreshtokenlifetime = models.IntegerField(
        db_column="RefreshTokenLifetime"
    )  # Field name made lowercase.
    allowedorigin = models.CharField(
        db_column="AllowedOrigin", max_length=512, blank=True, null=True
    )  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = "ApplicationClients"


class ClientDelegations(models.Model):
    clientid = models.ForeignKey(
        "ClientRefs", models.DO_NOTHING, db_column="ClientId"
    )  # Field name made lowercase.
    userid = models.ForeignKey(
        "Users", models.DO_NOTHING, db_column="UserId"
    )  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = "ClientDelegations"


class ClientRefs(models.Model):
    id = models.CharField(
        db_column="Id", primary_key=True, max_length=36
    )  # Field name made lowercase.
    clientno = models.ForeignKey(
        "LegacyClient",
        models.DO_NOTHING,
        db_column="ClientNo",
        unique=True,
        related_name="web_client_refs",
    )  # Field name made lowercase.
    userid = models.ForeignKey(
        "Users", models.DO_NOTHING, db_column="UserId"
    )  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = "ClientRefs"


class Destinations(models.Model):
    id = models.CharField(
        db_column="Id", primary_key=True, max_length=36
    )  # Field name made lowercase.
    streetaddress = models.CharField(
        db_column="StreetAddress", max_length=512, blank=True, null=True
    )  # Field name made lowercase.
    suburb = models.CharField(
        db_column="Suburb", max_length=100
    )  # Field name made lowercase.
    locationname = models.CharField(
        db_column="LocationName", max_length=100, blank=True, null=True
    )  # Field name made lowercase.
    postcode = models.IntegerField(db_column="PostCode")  # Field name made lowercase.
    state = models.CharField(
        db_column="State", max_length=5
    )  # Field name made lowercase.
    orderid = models.ForeignKey(
        "Orders", models.DO_NOTHING, db_column="OrderId", blank=True, null=True
    )  # Field name made lowercase.
    sequence = models.IntegerField(
        db_column="Sequence", blank=True, null=True
    )  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = "Destinations"


class Localities(models.Model):
    id = models.CharField(
        db_column="Id", primary_key=True, max_length=36
    )  # Field name made lowercase.
    name = models.CharField(
        db_column="Name", max_length=255
    )  # Field name made lowercase.
    postcode = models.IntegerField(db_column="PostCode")  # Field name made lowercase.
    isvisible = models.BooleanField(db_column="IsVisible")  # Field name made lowercase.
    isinternalonly = models.BooleanField(
        db_column="IsInternalOnly"
    )  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = "Localities"


class Orders(models.Model):
    id = models.CharField(
        db_column="Id", primary_key=True, max_length=36
    )  # Field name made lowercase.
    createdon = models.DateTimeField(
        db_column="CreatedOn"
    )  # Field name made lowercase.
    datetimerequired = models.DateTimeField(
        db_column="DateTimeRequired"
    )  # Field name made lowercase.
    status = models.CharField(
        db_column="Status", max_length=255
    )  # Field name made lowercase.
    passengername = models.CharField(
        db_column="PassengerName", max_length=255
    )  # Field name made lowercase.
    passengermobile = models.CharField(
        db_column="PassengerMobile", max_length=255
    )  # Field name made lowercase.
    passengercount = models.IntegerField(
        db_column="PassengerCount"
    )  # Field name made lowercase.
    luggagecount = models.IntegerField(
        db_column="LuggageCount"
    )  # Field name made lowercase.
    babyseatsrequired = models.IntegerField(
        db_column="BabySeatsRequired"
    )  # Field name made lowercase.
    babycapsulesrequired = models.IntegerField(
        db_column="BabyCapsulesRequired"
    )  # Field name made lowercase.
    boosterseatsrequired = models.IntegerField(
        db_column="BoosterSeatsRequired"
    )  # Field name made lowercase.
    weddingribbonrequired = models.BooleanField(
        db_column="WeddingRibbonRequired"
    )  # Field name made lowercase.
    cartype = models.CharField(
        db_column="CarType", max_length=255, blank=True, null=True
    )  # Field name made lowercase.
    estimatedcost = models.DecimalField(
        db_column="EstimatedCost",
        max_digits=19,
        decimal_places=5,
        blank=True,
        null=True,
    )  # Field name made lowercase.
    instructions = models.CharField(
        db_column="Instructions", max_length=4000, blank=True, null=True
    )  # Field name made lowercase.
    totalcost = models.DecimalField(
        db_column="TotalCost", max_digits=19, decimal_places=5, blank=True, null=True
    )  # Field name made lowercase.
    timecost = models.DecimalField(
        db_column="TimeCost", max_digits=19, decimal_places=5, blank=True, null=True
    )  # Field name made lowercase.
    travelcost = models.DecimalField(
        db_column="TravelCost", max_digits=19, decimal_places=5, blank=True, null=True
    )  # Field name made lowercase.
    extrascost = models.DecimalField(
        db_column="ExtrasCost", max_digits=19, decimal_places=5, blank=True, null=True
    )  # Field name made lowercase.
    carcost = models.DecimalField(
        db_column="CarCost", max_digits=19, decimal_places=5, blank=True, null=True
    )  # Field name made lowercase.
    specialeventcost = models.DecimalField(
        db_column="SpecialEventCost",
        max_digits=19,
        decimal_places=5,
        blank=True,
        null=True,
    )  # Field name made lowercase.
    applicablespecialevents = models.CharField(
        db_column="ApplicableSpecialEvents", max_length=4000, blank=True, null=True
    )  # Field name made lowercase.
    invoicemessages = models.CharField(
        db_column="InvoiceMessages", max_length=4000, blank=True, null=True
    )  # Field name made lowercase.
    clientid = models.ForeignKey(
        ClientRefs, models.DO_NOTHING, db_column="ClientId"
    )  # Field name made lowercase.
    userid = models.ForeignKey(
        "Users", models.DO_NOTHING, db_column="UserId"
    )  # Field name made lowercase.
    pickupflightdelay = models.IntegerField(
        db_column="PickupFlightDelay", blank=True, null=True
    )  # Field name made lowercase.
    airportdeparturetime = models.DateTimeField(
        db_column="AirportDepartureTime", blank=True, null=True
    )  # Field name made lowercase.
    rateschedule = models.CharField(
        db_column="RateSchedule", max_length=30, blank=True, null=True
    )  # Field name made lowercase.
    discount = models.DecimalField(
        db_column="Discount", max_digits=19, decimal_places=5, blank=True, null=True
    )  # Field name made lowercase.
    applicablediscounts = models.CharField(
        db_column="ApplicableDiscounts", max_length=4000, blank=True, null=True
    )  # Field name made lowercase.
    garagepassrequired = models.BooleanField(
        db_column="GaragePassRequired"
    )  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = "Orders"


class Pickups(models.Model):
    id = models.CharField(
        db_column="Id", primary_key=True, max_length=36
    )  # Field name made lowercase.
    streetaddress = models.CharField(
        db_column="StreetAddress", max_length=512, blank=True, null=True
    )  # Field name made lowercase.
    suburb = models.CharField(
        db_column="Suburb", max_length=100
    )  # Field name made lowercase.
    locationname = models.CharField(
        db_column="LocationName", max_length=100, blank=True, null=True
    )  # Field name made lowercase.
    postcode = models.IntegerField(db_column="PostCode")  # Field name made lowercase.
    state = models.CharField(
        db_column="State", max_length=5
    )  # Field name made lowercase.
    flightnumber = models.CharField(
        db_column="FlightNumber", max_length=20, blank=True, null=True
    )  # Field name made lowercase.
    orderid = models.ForeignKey(
        Orders, models.DO_NOTHING, db_column="OrderId", blank=True, null=True
    )  # Field name made lowercase.
    sequence = models.IntegerField(
        db_column="Sequence", blank=True, null=True
    )  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = "Pickups"


class Refreshtokens(models.Model):
    id = models.CharField(
        db_column="Id", primary_key=True, max_length=36
    )  # Field name made lowercase.
    token = models.CharField(
        db_column="Token", unique=True, max_length=255, blank=True, null=True
    )  # Field name made lowercase.
    subject = models.CharField(
        db_column="Subject", max_length=50
    )  # Field name made lowercase.
    issuedutc = models.DateTimeField(
        db_column="IssuedUtc"
    )  # Field name made lowercase.
    expiresutc = models.DateTimeField(
        db_column="ExpiresUtc"
    )  # Field name made lowercase.
    protectedticket = models.CharField(
        db_column="ProtectedTicket", max_length=1024
    )  # Field name made lowercase.
    client = models.ForeignKey(
        ApplicationClients, models.DO_NOTHING, db_column="Client_id"
    )  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = "RefreshTokens"


class Userclaims(models.Model):
    id = models.AutoField(
        db_column="Id", primary_key=True
    )  # Field name made lowercase.
    claimtype = models.CharField(
        db_column="ClaimType", max_length=255, blank=True, null=True
    )  # Field name made lowercase.
    claimvalue = models.CharField(
        db_column="ClaimValue", max_length=255, blank=True, null=True
    )  # Field name made lowercase.
    user = models.ForeignKey(
        "Users", models.DO_NOTHING, db_column="User_id", blank=True, null=True
    )  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = "UserClaims"


class Userlogins(models.Model):
    identityuser = models.ForeignKey(
        "Users", models.DO_NOTHING, db_column="IdentityUser_id"
    )  # Field name made lowercase.
    providerkey = models.CharField(
        db_column="ProviderKey", max_length=255, blank=True, null=True
    )  # Field name made lowercase.
    loginprovider = models.CharField(
        db_column="LoginProvider", max_length=255, blank=True, null=True
    )  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = "UserLogins"


class Userrolemap(models.Model):
    identityrole = models.ForeignKey(
        "Userroles", models.DO_NOTHING, db_column="IdentityRole_id"
    )  # Field name made lowercase.
    identityuser = models.ForeignKey(
        "Users", models.DO_NOTHING, db_column="IdentityUser_id"
    )  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = "UserRoleMap"


class Userroles(models.Model):
    id = models.CharField(
        db_column="Id", primary_key=True, max_length=255
    )  # Field name made lowercase.
    roletype = models.CharField(
        db_column="RoleType", max_length=255
    )  # Field name made lowercase.
    name = models.CharField(
        db_column="Name", unique=True, max_length=255
    )  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = "UserRoles"


class Users(models.Model):
    id = models.CharField(
        db_column="Id", primary_key=True, max_length=255
    )  # Field name made lowercase.
    usertype = models.CharField(
        db_column="UserType", max_length=255
    )  # Field name made lowercase.
    accessfailedcount = models.IntegerField(
        db_column="AccessFailedCount", blank=True, null=True
    )  # Field name made lowercase.
    email = models.CharField(
        db_column="Email", max_length=255, blank=True, null=True
    )  # Field name made lowercase.
    emailconfirmed = models.BooleanField(
        db_column="EmailConfirmed", blank=True, null=True
    )  # Field name made lowercase.
    lockoutenabled = models.BooleanField(
        db_column="LockoutEnabled", blank=True, null=True
    )  # Field name made lowercase.
    lockoutenddateutc = models.DateTimeField(
        db_column="LockoutEndDateUtc", blank=True, null=True
    )  # Field name made lowercase.
    passwordhash = models.CharField(
        db_column="PasswordHash", max_length=255, blank=True, null=True
    )  # Field name made lowercase.
    phonenumber = models.CharField(
        db_column="PhoneNumber", max_length=255, blank=True, null=True
    )  # Field name made lowercase.
    phonenumberconfirmed = models.BooleanField(
        db_column="PhoneNumberConfirmed", blank=True, null=True
    )  # Field name made lowercase.
    twofactorenabled = models.BooleanField(
        db_column="TwoFactorEnabled", blank=True, null=True
    )  # Field name made lowercase.
    username = models.CharField(
        db_column="UserName", unique=True, max_length=255
    )  # Field name made lowercase.
    securitystamp = models.CharField(
        db_column="SecurityStamp", max_length=255, blank=True, null=True
    )  # Field name made lowercase.
    firstname = models.CharField(
        db_column="FirstName", max_length=70
    )  # Field name made lowercase.
    lastname = models.CharField(
        db_column="LastName", max_length=70
    )  # Field name made lowercase.
    resetshorttoken = models.CharField(
        db_column="ResetShortToken", max_length=32, blank=True, null=True
    )  # Field name made lowercase.
    emailshorttoken = models.CharField(
        db_column="EmailShortToken", max_length=32, blank=True, null=True
    )  # Field name made lowercase.
    resettoken = models.CharField(
        db_column="ResetToken", max_length=512, blank=True, null=True
    )  # Field name made lowercase.
    emailtoken = models.CharField(
        db_column="EmailToken", max_length=512, blank=True, null=True
    )  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = "Users"
